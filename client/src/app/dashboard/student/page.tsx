import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCapIcon,
  BookOpenIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  MailIcon,
  Terminal,
} from "lucide-react";
import {
  getMyEnrollments,
  buildProgressMap,
  getAllMyLessonProgresses,
  getAllMyQuizAttempts,
} from "./_lib/api";
import { requireStudentAuth } from "./_lib/auth";
import { OverviewCharts } from "./_components/OverviewCharts";
import { Enrollment, LessonProgress, QuizAttempt } from "./_lib/types";

export const metadata: Metadata = {
  title: "Student Dashboard",
};

export default async function StudentDashboardOverview() {
  const { token, me } = await requireStudentAuth();

  // Fetch stats dashboard data in parallel
  let enrollments: Enrollment[] = [];
  let progresses: LessonProgress[] = [];
  let attempts: QuizAttempt[] = [];

  try {
    const [enrollmentsRes, progressesRes, attemptsRes] = await Promise.all([
      getMyEnrollments(token, me.documentId),
      getAllMyLessonProgresses(token, me.documentId),
      getAllMyQuizAttempts(token, me.documentId),
    ]);
    enrollments = enrollmentsRes.data ?? [];
    progresses = progressesRes.data ?? [];
    attempts = attemptsRes.data ?? [];
  } catch (err) {
    console.error("[overview] Failed to fetch stats data", err);
  }

  const progressMap = await buildProgressMap(enrollments, token, me.documentId);

  const enrolledCount = enrollments.length;
  const completedLessonsCount = progresses.filter((p) => p.completed).length;
  const passedQuizzesCount = attempts.filter((a) => a.passed).length;

  // Recent 3 enrolled courses to display
  const recentEnrollments = enrollments.slice(0, 3);

  // Recent 4 quiz attempts to display
  const recentAttempts = attempts.slice(0, 4);

  return (
    <div className="relative p-6  sm:p-8 min-h-screen bg-grid-cyber">
      {/* Background radial highlight */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto py-8 max-w-5xl xl:max-w-6xl w-full space-y-8">
        {/* Decorative floating badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono w-max rounded-full border border-primary/10 bg-primary/5 text-primary">
          <Terminal className="size-3.5" />
          <span>system_status: online</span>
        </div>

        {/* Welcome Page Header */}
        <PageHeader
          title={`স্বাগতম, ${me.fullName ?? me.username}! আজকে কি প্রবলেম সলভ করব?.cpp`}
          description="তোমার রানিং কোর্সের কন্ডিশন, সলভ করা লেসন আর কুইজ ট্র্যাকের রিপোর্টকার্ড।"
          className="mb-8"
        >
          <Button
            nativeButton={false}
            className="shadow-md hover:shadow-primary/10 transition-all font-semibold"
            render={<Link href="/courses">নতুন কোর্স খুঁজি</Link>}
          />
        </PageHeader>

        {/* Stats Cards Row */}
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Card 1: Enrolled Courses */}
          <Card className="relative overflow-hidden border border-border/40 bg-card/50 backdrop-blur-xl group hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 p-6">
            {/* BST Graphic background */}
            <svg
              className="absolute right-3 bottom-0 h-16 w-16 opacity-10 pointer-events-none stroke-primary group-hover:scale-105 transition-transform duration-300"
              viewBox="0 0 100 100"
              fill="none"
            >
              <circle cx="50" cy="20" r="6" strokeWidth="2" />
              <circle cx="25" cy="50" r="6" strokeWidth="2" />
              <circle cx="75" cy="50" r="6" strokeWidth="2" />
              <circle cx="15" cy="80" r="6" strokeWidth="2" />
              <circle cx="35" cy="80" r="6" strokeWidth="2" />
              <path
                d="M50 26 L25 44 M50 26 L75 44 M25 56 L15 74 M25 56 L35 74"
                strokeWidth="2"
              />
            </svg>
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                running_courses.h
              </span>
              <h3 className="text-3xl font-bold tracking-tight font-mono text-foreground">
                {enrolledCount}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                কোর্সে লড়াই চলছে
              </p>
            </div>
          </Card>

          {/* Card 2: Completed Lessons */}
          <Card className="relative overflow-hidden border border-border/40 bg-card/50 backdrop-blur-xl group hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 p-6">
            {/* DP Grid SVG background */}
            <svg
              className="absolute right-4 bottom-0 h-16 w-16 opacity-10 pointer-events-none stroke-primary/80 group-hover:scale-105 transition-transform duration-300 font-mono text-[8px]"
              viewBox="0 0 100 100"
              fill="none"
            >
              <rect
                x="10"
                y="10"
                width="80"
                height="80"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
              <line x1="10" y1="36" x2="90" y2="36" strokeWidth="1.5" />
              <line x1="10" y1="63" x2="90" y2="63" strokeWidth="1.5" />
              <line x1="36" y1="10" x2="36" y2="90" strokeWidth="1.5" />
              <line x1="63" y1="10" x2="63" y2="90" strokeWidth="1.5" />
              <text x="18" y="26" fill="currentColor">
                0
              </text>
              <text x="44" y="26" fill="currentColor">
                1
              </text>
              <text x="70" y="52" fill="currentColor" className="font-bold">
                ac
              </text>
            </svg>
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                lessons_completed.log
              </span>
              <h3 className="text-3xl font-bold tracking-tight font-mono text-foreground">
                {completedLessonsCount}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                লেসন সম্পন্ন করেছ
              </p>
            </div>
          </Card>

          {/* Card 3: Cleared Quizzes */}
          <Card className="relative overflow-hidden border border-border/40 bg-card/50 backdrop-blur-xl group hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 p-6">
            {/* Network Graph SVG background */}
            <svg
              className="absolute right-3 bottom-0 h-16 w-16 opacity-10 pointer-events-none stroke-primary/95 group-hover:scale-105 transition-transform duration-300"
              viewBox="0 0 100 100"
              fill="none"
            >
              <circle cx="20" cy="30" r="5" strokeWidth="2" />
              <circle cx="80" cy="20" r="5" strokeWidth="2" />
              <circle cx="50" cy="65" r="5" strokeWidth="2" />
              <circle cx="30" cy="80" r="5" strokeWidth="2" />
              <circle cx="70" cy="80" r="5" strokeWidth="2" />
              <line x1="20" y1="30" x2="50" y2="65" strokeWidth="1.5" />
              <line x1="80" y1="20" x2="50" y2="65" strokeWidth="1.5" />
              <line x1="50" y1="65" x2="30" y2="80" strokeWidth="1.5" />
              <line x1="50" y1="65" x2="70" y2="80" strokeWidth="1.5" />
            </svg>
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                quizzes_ac.json
              </span>
              <h3 className="text-3xl font-bold tracking-tight font-mono text-foreground">
                {passedQuizzesCount}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                সবুজ বাতি (AC) কুইজ
              </p>
            </div>
          </Card>
        </div>

        {/* Render Recharts charts */}
        <OverviewCharts progresses={progresses} attempts={attempts} />

        {/* Main content split layout */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Recent Courses */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <BookOpenIcon className="h-4.5 w-4.5 text-primary" />
                আমার চলমান কোর্সসমূহ.cpp
              </h2>
              {enrolledCount > 3 && (
                <Link
                  href="/dashboard/student/my-courses"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  সবগুলো কোর্স
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            {recentEnrollments.length === 0 ? (
              <Card className="border border-dashed border-border/80 bg-muted/10 p-8">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground gap-3">
                  <GraduationCapIcon className="h-10 w-10 opacity-30" />
                  <p className="font-semibold text-sm">
                    তুমি এখনও কোনো অ্যাক্টিভ কোর্সে এনরোল করোনি!
                  </p>
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link href="/courses">কোর্স ক্যাটাগরি ব্রাউজ করুন</Link>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {recentEnrollments.map((enrollment) => {
                  const course = enrollment.course;
                  if (!course) return null;

                  // Extract total count of lessons and user progress count
                  const totalLessons = course.lessons?.length ?? 0;
                  const completedLessons = progressMap[course.documentId] ?? 0;

                  return (
                    <Card
                      key={enrollment.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 border border-border/30 bg-card/60 hover:bg-card/90 transition-all hover:border-primary/20"
                    >
                      <div className="space-y-1.5 flex-1">
                        <h3 className="font-semibold text-base leading-snug text-foreground">
                          {course.title}
                        </h3>
                        {course.instructor && (
                          <p className="text-xs text-muted-foreground font-medium">
                            এক্সপার্ট মেন্টর:{" "}
                            {course.instructor.fullName ??
                              course.instructor.username}
                          </p>
                        )}

                        <div className="pt-3 max-w-sm">
                          <ProgressBar
                            value={completedLessons}
                            max={totalLessons}
                            showLabel={true}
                            unit="lessons"
                          />
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-start sm:justify-end">
                        <Button
                          size="sm"
                          className="gap-1.5 font-semibold"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/dashboard/student/courses/${course.documentId}`}
                            >
                              ক্লাস শুরু করো
                              <ArrowRightIcon className="h-3.5 w-3.5" />
                            </Link>
                          }
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Sidebar (Attempts, Quick Links) */}
          <div className="space-y-6">
            {/* Quick Links Card */}
            <Card className="border border-border/40 bg-card/50 backdrop-blur-xl relative overflow-hidden transition-all hover:border-primary/10">
              <div className="absolute top-2 right-2 text-[9px] font-mono opacity-15 text-primary">
                #include &lt;links.h&gt;
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  শর্টকাট লিংকস.h
                </CardTitle>
                <CardDescription>
                  জরুরি সেকশনগুলোতে জলদি নেভিগেট করো
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-xs font-medium"
                  nativeButton={false}
                  render={
                    <Link href="/courses">
                      <ExternalLinkIcon className="h-3.5 w-3.5 text-primary/80" />
                      সবগুলো কোর্স
                    </Link>
                  }
                />
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-xs font-medium"
                  nativeButton={false}
                  render={
                    <Link href="/dashboard/student/my-courses">
                      <BookOpenIcon className="h-3.5 w-3.5 text-primary/80" />
                      আমার কোর্স ক্যাটালগ
                    </Link>
                  }
                />
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-xs font-medium"
                  nativeButton={false}
                  render={
                    <Link href="mailto:support@cpsacademy.com">
                      <MailIcon className="h-3.5 w-3.5 text-primary/80" />
                      মেন্টর সাপোর্ট (ইমেইল)
                    </Link>
                  }
                />
              </CardContent>
            </Card>

            {/* Quick Quiz attempt summary */}
            <Card className="border border-border/40 bg-card/50 backdrop-blur-xl relative overflow-hidden transition-all hover:border-primary/10">
              <div className="absolute top-2 right-2 text-[9px] font-mono opacity-15 text-primary">
                quiz_history.log
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  কুইজের রিপোর্টকার্ড.log
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {recentAttempts.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    কুইজ না দিলে নিজেকে যাচাই করবে ক্যামনে? জলদি প্র্যাকটিস শুরু
                    করো!
                  </p>
                ) : (
                  <div className="space-y-3 max-h-62.5 overflow-y-auto pr-1">
                    {recentAttempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0 last:pb-0 text-xs"
                      >
                        <div className="space-y-1 max-w-32.5">
                          <div className="font-semibold truncate text-foreground">
                            {attempt.quiz
                              ? `Quiz #${attempt.quiz.id ?? attempt.quiz.documentId}`
                              : "Course Quiz"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {new Date(attempt.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-semibold font-mono">
                            {attempt.score}/{attempt.totalPoints}
                          </div>
                          <Badge
                            variant={attempt.passed ? "default" : "destructive"}
                            className={`text-[9px] px-1.5 py-0 scale-90 ${
                              attempt.passed
                                ? "bg-cp-ac/10 text-cp-ac border-cp-ac/25"
                                : "bg-cp-wa/10 text-cp-wa border-cp-wa/25"
                            }`}
                          >
                            {attempt.passed
                              ? "এসি পাইছো (AC)"
                              : "লাল বাতি (WA)"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
