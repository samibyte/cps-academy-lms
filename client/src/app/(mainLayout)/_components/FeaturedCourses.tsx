import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { getFeaturedCourses, type FeaturedCourse } from "./_lib/courses";
import { Reveal } from "./motion/Reveal";
import { Section, SectionHeader } from "./Section";

const LEVEL_STYLES: Record<FeaturedCourse["level"], { label: string; className: string }> = {
  BEGINNER: { label: "BEGINNER", className: "bg-cp-ac/10 text-cp-ac border-cp-ac/25" },
  INTERMEDIATE: {
    label: "INTERMEDIATE",
    className: "bg-cp-tle/10 text-cp-tle border-cp-tle/25",
  },
  ADVANCED: {
    label: "ADVANCED",
    className: "bg-cp-re/10 text-cp-re border-cp-re/25",
  },
};

export function CourseCard({ course }: { course: FeaturedCourse }) {
  const level = LEVEL_STYLES[course.level];

  return (
    <Card className="group/cp-course flex h-full flex-col transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">{course.code}</span>
          <Badge
            variant="outline"
            className={cn("font-mono text-[10px] tracking-wider", level.className)}
          >
            {level.label}
          </Badge>
        </div>
        <CardTitle className="text-lg font-bold">{course.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {course.tags.length > 0 ? (
            course.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
              no_tags
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="justify-between gap-2">
        <div className="flex flex-col items-start gap-0.5">
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
        <Button
          size="sm"
          className="font-semibold"
          nativeButton={false}
          render={
            <Link href="/courses">
              কোর্সটি দেখুন
              <ArrowRight className="size-3.5" />
            </Link>
          }
        />
      </CardFooter>
    </Card>
  );
}

export async function FeaturedCourses() {
  const courses = await getFeaturedCourses();

  return (
    <Section>
      <Reveal>
        <SectionHeader
          eyebrow="// featured_courses"
          title="জনপ্রিয় কোর্সসমূহ"
          description="লেভেল বেছে নাও, এনরোল করো আর প্রতিদিন একটু করে স্টেপ অ্যাপ প্র্যাকটিস চালাও।"
        />
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map((course, index) => (
          <Reveal key={course.key} delay={Math.min(index * 0.07, 0.28)} className="h-full">
            <CourseCard course={course} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}