import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getMyEnrollments,
  buildProgressMap,
  strapiMediaUrl,
} from "../_lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  BookOpenIcon,
  GraduationCapIcon,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import MyCoursesList from "./_components/MyCoursesList";
import { requireAuth } from "../../_lib/auth";

export const metadata: Metadata = {
  title: "My Courses",
};

export default async function MyCoursesPage() {
  let authData;
  try {
    authData = await requireAuth(["Student"]);
  } catch {
    redirect("/auth/login");
  }
  const { token, me } = authData;

  const enrollmentsRes = await getMyEnrollments(token, me.documentId);
  const enrollments = enrollmentsRes.data;

  const progressMap = await buildProgressMap(enrollments, token, me.documentId);

  // Sort: in-progress courses first, completed last
  const sortedEnrollments = [...enrollments].sort((a, b) => {
    const aCompleted = a.enrollment_status === "completed" ? 1 : 0;
    const bCompleted = b.enrollment_status === "completed" ? 1 : 0;
    return aCompleted - bCompleted;
  });

  const completedCount = enrollments.filter(
    (e) => e.enrollment_status === "completed",
  ).length;
  const inProgressCount = enrollments.length - completedCount;

  const formattedEnrollments = sortedEnrollments
    .filter((e) => e.course !== null)
    .map((e) => {
      const course = e.course!;
      const thumbnailObj = course.thumbnail;
      const thumbnailUrl = thumbnailObj
        ? strapiMediaUrl(thumbnailObj.formats?.medium?.url ?? thumbnailObj.url)
        : null;
      const instructorName = course.instructor
        ? (course.instructor.fullName ?? course.instructor.username)
        : null;

      return {
        id: e.id,
        enrollment_status: e.enrollment_status as "active" | "completed",
        course: {
          documentId: course.documentId,
          title: course.title,
          level: course.level,
          thumbnailUrl,
          instructorName,
          lessonsCount: course.lessons?.length ?? 0,
          tags: course.tags ?? [],
        },
      };
    });

  return (
    <div className="relative p-6 sm:p-8 min-h-screen bg-grid-cyber">
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-5xl xl:max-w-6xl w-full space-y-8">
        {/* Decorative floating badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono w-max rounded-full border border-primary/10 bg-primary/5 text-primary">
          <Terminal className="size-3.5" />
          <span>loading enrollments...</span>
        </div>

        <PageHeader
          title="আমার কোর্সসমূহ"
          description="তুমি যে সব কোর্সে এনরোল করেছ, সেগুলোর প্রগ্রেস ট্র্যাক করো।"
        />

        {/* Summary counters */}
        {enrollments.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg border border-primary/15 bg-primary/5 text-primary">
              <BookOpenIcon className="size-3" />
              {inProgressCount} টি চলমান
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3" />
              {completedCount} টি সম্পন্ন (AC)
            </span>
          </div>
        )}

        {enrollments.length === 0 ? (
          <div className="mt-20 flex flex-col items-center gap-6 text-center text-muted-foreground">
            <div className="relative">
              <GraduationCapIcon className="h-16 w-16 opacity-20" />
              <div className="absolute -bottom-1 -right-1 text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/15">
                empty
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                এখনও কোনো কোর্সে এনরোল করোনি!
              </p>
              <p className="text-sm text-muted-foreground">
                যত দেরি করবে, তত পিছিয়ে পড়বে — আজই শুরু করো।
              </p>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/courses">কোর্স ক্যাটালগ দেখো</Link>}
            />
          </div>
        ) : (
          <MyCoursesList
            enrollments={formattedEnrollments}
            progressMap={progressMap}
          />
        )}
      </div>
    </div>
  );
}
