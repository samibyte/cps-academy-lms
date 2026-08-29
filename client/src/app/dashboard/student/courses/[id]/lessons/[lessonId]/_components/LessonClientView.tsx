"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlocksContent, BlocksRenderer } from "@strapi/blocks-react-renderer";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  Clock,
  Play,
  Lock,
  Terminal,
} from "lucide-react";
import { Lesson } from "@/app/dashboard/student/_lib/types";
import { markLessonCompleteAction } from "@/app/dashboard/student/_lib/actions";

interface LessonClientViewProps {
  courseId: string;
  lesson: Lesson;
  studentDocId: string;
  initialCompleted: boolean;
  prevLessonDocId: string | null;
  nextLessonDocId: string | null;
  isNextLocked: boolean;
}

function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return url;
}

export default function LessonClientView({
  courseId,
  lesson,
  studentDocId,
  initialCompleted,
  prevLessonDocId,
  nextLessonDocId,
  isNextLocked,
}: LessonClientViewProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = React.useState(initialCompleted);
  const [isPending, setIsPending] = React.useTransition();

  const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl);

  const handleMarkComplete = () => {
    setIsPending(async () => {
      setIsCompleted(true);
      const res = await markLessonCompleteAction(
        lesson.documentId,
        studentDocId,
        courseId,
      );
      if (!res.success) {
        setIsCompleted(initialCompleted);
        alert(res.message || "Failed to complete lesson");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="relative min-h-screen p-6 sm:p-8 bg-grid-cyber">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-5xl xl:max-w-6xl w-full space-y-6">
      {/* Top navigation bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border/30">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          nativeButton={false}
          render={
            <Link href={`/dashboard/student/courses/${courseId}`}>
              <ChevronLeftIcon className="h-4 w-4" />
              কোর্স মডিউলে
            </Link>
          }
        />
        <div className="flex items-center gap-3">
          {lesson.duration && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Clock className="size-3.5" />
              {lesson.duration} মিনিট
            </span>
          )}
          {isCompleted && (
            <Badge className="gap-1 text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 border">
              <CheckCircle2Icon className="h-3 w-3" />
              সম্পন্ন (AC)
            </Badge>
          )}
        </div>
      </div>

      {/* Lesson header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <Terminal className="size-3" />
          <span>lesson.cpp</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {lesson.title}
        </h1>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — video + text */}
        <div className="lg:col-span-2 space-y-6">
          {/* YouTube Video */}
          {embedUrl && (
            <div className="relative overflow-hidden rounded-xl border border-border/40 bg-black shadow-lg aspect-video">
              <iframe
                src={embedUrl}
                title={lesson.title}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Rich text content from Blocks */}
          {lesson.content && lesson.content.length > 0 ? (
            <article className="prose prose-neutral dark:prose-invert max-w-none rounded-xl border border-border/30 bg-card/60 p-6 sm:p-8 backdrop-blur-xl">
              <BlocksRenderer content={lesson.content as BlocksContent} />
            </article>
          ) : (
            !embedUrl && (
              <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                এই লেসনে কোনো লিখিত কন্টেন্ট নেই।
              </div>
            )
          )}
        </div>

        {/* Sidebar — mark complete + navigation */}
        <div className="space-y-4">
          {/* Mark complete card */}
          <div className="rounded-xl border border-border/40 bg-card/60 p-5 space-y-4 backdrop-blur-xl">
            <div className="text-[10px] font-mono text-muted-foreground">progress_tracker.cpp</div>
            <h3 className="font-bold text-sm">লেসনের স্ট্যাটাস আপডেট</h3>

            <Button
              className="w-full gap-2 py-5 text-sm font-semibold"
              onClick={handleMarkComplete}
              disabled={isCompleted || isPending}
              variant={isCompleted ? "outline" : "default"}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
                  সম্পন্ন করা হয়েছে
                </>
              ) : isPending ? (
                "আপডেট হচ্ছে..."
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  সম্পন্ন চিহ্নিত করো
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground leading-snug font-mono">
              # লেসন সম্পন্ন হলে পরেরটি আনলক হয়
            </p>
          </div>

          {/* Navigation controls */}
          <div className="flex gap-2">
            {prevLessonDocId ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1 text-xs"
                nativeButton={false}
                render={
                  <Link href={`/dashboard/student/courses/${courseId}/lessons/${prevLessonDocId}`}>
                    <ArrowLeftIcon className="h-3.5 w-3.5" />
                    আগেরটা
                  </Link>
                }
              />
            ) : (
              <Button variant="outline" size="sm" className="flex-1 text-xs opacity-30" disabled>
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                আগেরটা
              </Button>
            )}

            {nextLessonDocId ? (
              isNextLocked ? (
                <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs opacity-50" disabled>
                  পরেরটা
                  <Lock className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1 text-xs"
                  nativeButton={false}
                  render={
                    <Link href={`/dashboard/student/courses/${courseId}/lessons/${nextLessonDocId}`}>
                      পরেরটা
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </Link>
                  }
                />
              )
            ) : (
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-1 text-xs"
                nativeButton={false}
                render={
                  <Link href={`/dashboard/student/courses/${courseId}`}>
                    কোর্স শেষ
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                }
              />
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
