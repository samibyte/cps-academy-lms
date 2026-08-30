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

import { type FeaturedCourse } from "./_lib/courses";
import { getFeaturedCourses } from "./_actions/coursesActions";
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

import { CourseCardClient } from "./CourseCardClient";

export function CourseCard({ course }: { course: FeaturedCourse }) {
  return <CourseCardClient course={course} />;
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