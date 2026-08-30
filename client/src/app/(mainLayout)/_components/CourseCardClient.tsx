"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { type FeaturedCourse } from "./_lib/courses";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<
  FeaturedCourse["level"],
  { label: string; className: string }
> = {
  BEGINNER: {
    label: "BEGINNER",
    className: "bg-cp-ac/10 text-cp-ac border-cp-ac/25",
  },
  INTERMEDIATE: {
    label: "INTERMEDIATE",
    className: "bg-cp-tle/10 text-cp-tle border-cp-tle/25",
  },
  ADVANCED: {
    label: "ADVANCED",
    className: "bg-cp-re/10 text-cp-re border-cp-re/25",
  },
};

export function CourseCardClient({ course }: { course: FeaturedCourse }) {
  const level = LEVEL_STYLES[course.level];

  return (
    <Card className="group/cp-course flex h-full flex-col transition-all border border-border/30 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md bg-card/20 backdrop-blur-md">
      <Link
        href={`/courses/${course.slug}`}
        className="flex flex-col flex-1 min-h-0"
      >
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {course.code}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-[10px] tracking-wider",
                level.className,
              )}
            >
              {level.label}
            </Badge>
          </div>
          <CardTitle className="text-lg font-bold line-clamp-1">
            {course.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3">
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {course.description}
          </p>
          <div className="mt-auto flex flex-wrap gap-1.5">
            {course.tags.length > 0 ? (
              course.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded-md border border-border/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 bg-muted/10"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/30">
                no_tags
              </span>
            )}
          </div>
        </CardContent>
      </Link>

      <CardFooter className="flex flex-col gap-3 border-t border-border/20 pt-4 mt-2">
        <div className="flex w-full items-center justify-between">
          <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <BookOpen className="size-3 text-primary/80" />
            {course.lessons} lessons
          </span>
          {course.isFree ? (
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/25 text-[10px]"
            >
              ফ্রি
            </Badge>
          ) : (
            <span className="font-mono text-sm font-semibold text-foreground">
              ৳{course.price}
            </span>
          )}
        </div>

        <div className="flex w-full items-center gap-2">
          <Button
            size="sm"
            className="w-full font-semibold h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            nativeButton={false}
            render={
              <Link href={`/courses/${course.slug}`}>
                কোর্স দেখুন
                <ArrowRight className="size-3.5 ml-1" />
              </Link>
            }
          />
        </div>
      </CardFooter>
    </Card>
  );
}
