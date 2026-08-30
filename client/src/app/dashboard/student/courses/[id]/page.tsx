import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlayCircleIcon,
  CheckCircle2Icon,
  LockIcon,
  HelpCircleIcon,
  BookOpenIcon,
  Clock,
  ArrowLeft,
  Tag,
  Terminal,
} from "lucide-react";
import {
  getCourseWithLessons,
  getLessonProgresses,
  getQuizForCourse,
  touchEnrollmentLastAccessed,
} from "../../_lib/api";
import { requireAuth } from "@/app/dashboard/_lib/auth";

export const metadata: Metadata = {
  title: "Course",
};

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { id } = await params;
  const { token, me } = await requireAuth(["Student"]);

  // Update lastAccessedAt in background (non-blocking)
  touchEnrollmentLastAccessed(id, me.documentId, token).catch(() => {});

  const courseRes = await getCourseWithLessons(id, token);
  const course = courseRes.data;
  if (!course) redirect("/dashboard/student/my-courses");

  const progressRes = await getLessonProgresses(id, token, me.documentId);
  const progressList = progressRes.data;

  const completedLessonDocIds = new Set(
    progressList.filter((p) => p.completed).map((p) => p.lesson?.documentId),
  );

  const quiz = await getQuizForCourse(id, token);
  const lessons = course.lessons ?? [];
  const completedCount = completedLessonDocIds.size;
  const allCompleted =
    lessons.length > 0 &&
    lessons.every((l) => completedLessonDocIds.has(l.documentId));

  return (
    <div className="relative p-6 sm:p-8 min-h-screen bg-grid-cyber">
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-5xl xl:max-w-6xl w-full space-y-8">
        {/* Back nav */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          nativeButton={false}
          render={
            <Link href="/dashboard/student/my-courses">
              <ArrowLeft className="size-3.5" />
              আমার কোর্স তালিকায় ফিরি
            </Link>
          }
        />

        <PageHeader
          title={course.title}
          description={course.shortDescription}
        />

        {/* Course meta info row */}
        <div className="flex flex-wrap gap-3 -mt-2">
          {course.level && (
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-border/40 bg-muted/30 text-muted-foreground">
              level: {course.level}
            </span>
          )}
          {course.tags?.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full bg-primary/5 text-primary border border-primary/15"
            >
              <Tag className="size-2.5" />
              {tag}
            </span>
          ))}
          {course.instructor && (
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-border/40 bg-muted/30 text-muted-foreground">
              মেন্টর: {course.instructor.fullName ?? course.instructor.username}
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lesson List — main column */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <BookOpenIcon className="h-4.5 w-4.5 text-primary" />
              কোর্স কন্টেন্ট.cpp ({lessons.length} টি লেসন)
            </h2>

            {lessons.length === 0 ? (
              <Card className="border border-dashed border-border/50 bg-card/40 p-8 text-center text-sm text-muted-foreground">
                এই কোর্সে এখনও কোনো লেসন পাবলিশ করা হয়নি।
              </Card>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson, idx) => {
                  const isCompleted = completedLessonDocIds.has(
                    lesson.documentId,
                  );
                  const isLocked =
                    idx > 0 &&
                    !completedLessonDocIds.has(lessons[idx - 1].documentId);

                  const content = (
                    <>
                      {/* Status icon */}
                      <div className="shrink-0">
                        {isCompleted ? (
                          <CheckCircle2Icon className="size-5 text-emerald-500" />
                        ) : isLocked ? (
                          <LockIcon className="size-5 text-muted-foreground/40" />
                        ) : (
                          <PlayCircleIcon className="size-5 text-primary" />
                        )}
                      </div>

                      {/* Lesson info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground/60">
                            {String(idx + 1).padStart(2, "0")}.
                          </span>
                          <span
                            className={`text-sm truncate ${
                              isLocked
                                ? "font-medium text-muted-foreground"
                                : "font-semibold text-foreground group-hover:text-primary transition-colors"
                            }`}
                          >
                            {lesson.title}
                          </span>
                        </div>
                        {lesson.duration && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mt-0.5">
                            <Clock className="size-2.5" />
                            {lesson.duration / 60} মিনিট
                          </span>
                        )}
                      </div>

                      {/* Status badge */}
                      <div className="shrink-0">
                        {isCompleted && (
                          <Badge className="text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 border">
                            AC ✓
                          </Badge>
                        )}
                        {isLocked && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-mono"
                          >
                            locked
                          </Badge>
                        )}
                      </div>
                    </>
                  );

                  const containerClassName = `flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 group ${
                    isCompleted
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : isLocked
                        ? "border-border/30 bg-muted/10 opacity-60 cursor-not-allowed"
                        : "border-border/30 bg-card/50 hover:border-primary/20 hover:bg-card/80 cursor-pointer"
                  }`;

                  if (isLocked) {
                    return (
                      <div key={lesson.id} className={containerClassName}>
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={lesson.id}
                      href={`/dashboard/student/courses/${id}/lessons/${lesson.documentId}`}
                      className={containerClassName}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar: progress + quiz unlock */}
          <div className="space-y-5">
            {/* Progress card */}
            <Card className="border border-border/40 bg-card/50 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[9px] font-mono opacity-15 text-primary">
                progress.json
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Terminal className="size-3.5 text-primary" />
                  কোর্স প্রগ্রেস.log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center pb-2 border-b border-border/30">
                  <span className="text-4xl font-bold font-mono text-foreground">
                    {completedCount}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">
                    / {lessons.length} লেসন
                  </span>
                </div>
                <ProgressBar
                  value={completedCount}
                  max={lessons.length}
                  showLabel={false}
                />
                <p className="text-center text-[10px] font-mono text-muted-foreground">
                  {lessons.length > 0
                    ? `${Math.round((completedCount / lessons.length) * 100)}% সম্পন্ন হয়েছে`
                    : "কোনো লেসন নেই"}
                </p>
              </CardContent>
            </Card>

            {/* Quiz unlock card */}
            <Card className="border border-border/40 bg-card/50 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[9px] font-mono opacity-15 text-primary">
                quiz.exe
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <HelpCircleIcon className="size-3.5 text-primary" />
                  চূড়ান্ত কুইজ.exe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quiz ? (
                  <>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      সব লেসন সম্পন্ন করলে কুইজ আনলক হবে। পাসিং স্কোর:{" "}
                      <span className="font-semibold text-foreground font-mono">
                        {quiz.passingScore}%
                      </span>
                    </p>
                    <div className="text-[10px] font-mono text-muted-foreground space-y-1">
                      <div>
                        সময়সীমা: {Math.floor(quiz.timeLimit / 60)} মিনিট
                      </div>
                      <div>প্রশ্নসংখ্যা: {quiz.questions?.length ?? 0}টি</div>
                    </div>
                    {allCompleted ? (
                      <Button
                        className="w-full gap-2 font-semibold"
                        nativeButton={false}
                        render={
                          <Link href={`/dashboard/student/courses/${id}/quiz`}>
                            কুইজ দিতে যাও
                            <HelpCircleIcon className="h-3.5 w-3.5" />
                          </Link>
                        }
                      />
                    ) : (
                      <div className="space-y-2">
                        <Button className="w-full gap-2" disabled>
                          <LockIcon className="h-3.5 w-3.5" />
                          কুইজ লক আছে
                        </Button>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono text-center">
                          সব লেসন শেষ করলেই কুইজ খুলবে
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    এই কোর্সের জন্য কোনো কুইজ নেই।
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
