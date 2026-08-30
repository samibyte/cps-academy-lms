"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CourseTable } from "./CourseTable";
import { deleteCourseAction } from "@/app/dashboard/_lib/actions";
import type { Course } from "@/app/dashboard/_lib/types";
import type { InstructorSummary } from "@/app/dashboard/_lib/api";

interface CourseListClientProps {
  courses: Course[];
  basePath: string;
  showOwner?: boolean;
  canSelectInstructor?: boolean;
  instructors?: InstructorSummary[];
}

export function CourseListClient({
  courses,
  basePath,
  showOwner,
  canSelectInstructor,
  instructors,
}: CourseListClientProps) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    const result = await deleteCourseAction(id);
    if (result.success) {
      toast.success("কোর্সটি সফলভাবে মুছে ফেলা হয়েছে।");
      router.refresh();
    } else {
      toast.error(`মুছতে ব্যর্থ হয়েছে: ${(result as { success: false; error: string }).error}`);
    }
  };

  return (
    <CourseTable
      courses={courses}
      basePath={basePath}
      showOwner={showOwner}
      onDelete={handleDelete}
      canSelectInstructor={canSelectInstructor}
      instructors={instructors}
    />
  );
}
