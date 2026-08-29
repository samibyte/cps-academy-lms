"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/shared/ProgressBar";
import {
  BookOpenIcon,
  ArrowRightIcon,
  Clock,
  Terminal,
  Tag,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";


interface MyCoursesListProps {
  enrollments: Array<{
    id: number;
    enrollment_status: string;
    course: {
      documentId: string;
      title: string;
      level: string;
      thumbnailUrl: string | null;
      instructorName: string | null;
      lessonsCount: number;
      tags?: string[];
    };
  }>;
  progressMap: Record<string, number>;
}

const LEVEL_CONFIG: Record<
  string,
  { label: string; className: string; mono: string }
> = {
  Beginner: {
    label: "বিগিনার",
    mono: "#beginner",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  Intermediate: {
    label: "ইন্টারমিডিয়েট",
    mono: "#intermediate",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  Advanced: {
    label: "অ্যাডভান্সড",
    mono: "#advanced",
    className:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
};

export default function MyCoursesList({ enrollments, progressMap }: MyCoursesListProps) {
  const [filter, setFilter] = React.useState<"all" | "active" | "completed">("all");

  const filteredEnrollments = React.useMemo(() => {
    return enrollments.filter((e) => {
      if (filter === "all") return true;
      return e.enrollment_status === filter;
    });
  }, [enrollments, filter]);

  return (
    <div className="space-y-6">
      {/* Interactive Tabs / Filter Pills */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border/30 bg-card/40 backdrop-blur-xl w-max">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-300 ${
            filter === "all"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ./all_courses ({enrollments.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-300 ${
            filter === "active"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ./in_progress ({enrollments.filter((e) => e.enrollment_status !== "completed").length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-300 ${
            filter === "completed"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ./completed ({enrollments.filter((e) => e.enrollment_status === "completed").length})
        </button>
      </div>

      {filteredEnrollments.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4 text-center border border-dashed border-border/30 rounded-2xl bg-card/10 backdrop-blur-sm">
          <Terminal className="h-10 w-10 text-muted-foreground/30 font-light" />
          <p className="text-sm font-mono text-muted-foreground">
            {filter === "completed"
              ? "no completed courses found."
              : filter === "active"
                ? "all courses completed! (AC)"
                : "no enrollments found."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEnrollments.map((enrollment) => {
            const course = enrollment.course;
            if (!course) return null;

            const totalLessons = course.lessonsCount;
            const completedLessons = progressMap[course.documentId] ?? 0;
            const thumbnailUrl = course.thumbnailUrl;
            const levelConfig = LEVEL_CONFIG[course.level] ?? {
              label: course.level,
              mono: "#course",
              className: "bg-muted text-muted-foreground border-border",
            };
            const isCompleted = enrollment.enrollment_status === "completed";
            const progressPct =
              totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            return (
              <Card
                key={enrollment.id}
                className={`group flex flex-col overflow-hidden transition-all duration-300 backdrop-blur-xl ${
                  isCompleted
                    ? "border-2 border-emerald-500/40 bg-emerald-950/10 hover:border-emerald-500/60 hover:-translate-y-0.5 shadow-emerald-500/5 shadow-lg"
                    : "border border-border/30 bg-card/60 hover:border-primary/20 hover:-translate-y-0.5"
                }`}
              >
                {/* Thumbnail */}
                <div
                  className={`relative aspect-video w-full overflow-hidden bg-muted/30 ${
                    isCompleted ? "opacity-80" : ""
                  }`}
                >
                  {thumbnailUrl ? (
                    <Image
                      src={thumbnailUrl}
                      alt={course.title}
                      fill
                      className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
                        isCompleted ? "saturate-50 group-hover:saturate-75" : ""
                      }`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted/20">
                      <BookOpenIcon className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}

                  {/* Level badge overlay */}
                  {course.level && (
                    <span
                      className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-mono font-bold border ${levelConfig.className}`}
                    >
                      {levelConfig.mono}
                    </span>
                  )}

                  {/* Completed status badge — top right */}
                  {isCompleted ? (
                    <div className="absolute right-2 top-2 flex items-center gap-1 bg-emerald-950/80 backdrop-blur-sm text-emerald-400 text-[10px] font-mono font-bold px-2 py-1 rounded-md border border-emerald-500/30">
                      <CheckCircle2 className="size-3" />
                      AC ✓ সম্পন্ন
                    </div>
                  ) : (
                    <div className="absolute right-2 top-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-amber-400 text-[10px] font-mono font-bold px-2 py-1 rounded-md border border-amber-500/20">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                      চলমান
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2 pt-4">
                  <h2 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
                    {course.title}
                  </h2>
                  {course.instructorName && (
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                      মেন্টর: {course.instructorName}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="flex-1 pb-3 space-y-3">
                  <ProgressBar
                    value={completedLessons}
                    max={totalLessons}
                    unit="lessons"
                    showLabel={false}
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>
                      {completedLessons}/{totalLessons} লেসন
                    </span>
                    <span className={isCompleted ? "text-emerald-500 font-semibold" : ""}>
                      {progressPct}% সম্পন্ন
                    </span>
                  </div>

                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {course.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/10"
                        >
                          <Tag className="size-2" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {totalLessons} লেসন
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${levelConfig.className}`}
                    >
                      {levelConfig.label}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 pb-4">
                  {isCompleted ? (
                    <Button
                      className="w-full gap-2 text-sm font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50"
                      variant="outline"
                      nativeButton={false}
                      render={
                        <Link href={`/dashboard/student/courses/${course.documentId}`}>
                          <RefreshCw className="h-3.5 w-3.5" />
                          পুনরায় দেখো (Rewatch)
                        </Link>
                      }
                    />
                  ) : (
                    <Button
                      className="w-full gap-2 text-sm font-semibold"
                      nativeButton={false}
                      render={
                        <Link href={`/dashboard/student/courses/${course.documentId}`}>
                          ক্লাস চালিয়ে যাও
                          <ArrowRightIcon className="h-3.5 w-3.5" />
                        </Link>
                      }
                    />
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
