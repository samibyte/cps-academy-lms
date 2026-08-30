import { apiClient } from "@/lib/apiClient";

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface FeaturedCourse {
  key: string;
  code: string;
  title: string;
  description: string;
  level: CourseLevel;
  tags: string[];
  lessons: number;
  isFree: boolean;
  price?: number;
}

interface StrapiCourse {
  documentId: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  level: "Beginner" | "Intermediate" | "Advanced";
  tags: string[] | null;
  price: number | null;
  isFree: boolean;
  lessons?: { duration: number | null }[] | null;
}

interface FeaturedCoursesResponse {
  data: StrapiCourse[];
}

const LEVEL_MAP: Record<StrapiCourse["level"], CourseLevel> = {
  Beginner: "BEGINNER",
  Intermediate: "INTERMEDIATE",
  Advanced: "ADVANCED",
};

function mapCourse(course: StrapiCourse, index: number): FeaturedCourse {
  return {
    key: course.documentId,
    code: `CPS-${String(index + 1).padStart(2, "0")}`,
    title: course.title,
    description: course.shortDescription ?? "",
    level: LEVEL_MAP[course.level] ?? "BEGINNER",
    tags: course.tags ?? [],
    lessons: course.lessons?.length ?? 0,
    isFree: course.isFree,
    price: course.price ?? undefined,
  };
}

export const FALLBACK_FEATURED_COURSES: FeaturedCourse[] = [
  {
    key: "fallback-cps-101",
    code: "CPS-101",
    title: "সি ল্যাঙ্গুয়েজ: প্রথম রান",
    description:
      "ভেরিয়েবল থেকে রিকারশন — C-র প্রতিটি কনসেপ্ট হাতে-কলমে প্র্যাকটিস সহ।",
    level: "BEGINNER",
    tags: ["arrays", "loops", "functions"],
    lessons: 24,
    isFree: true,
  },
  {
    key: "fallback-cps-202",
    code: "CPS-202",
    title: "ডেটা স্ট্রাকচার ডেবে",
    description:
      "স্ট্যাক, কিউ, লিংকড লিস্ট আর ট্রি — রিয়েল প্রবলেম সলভ করে শেখো।",
    level: "INTERMEDIATE",
    tags: ["stack", "queue", "trees"],
    lessons: 32,
    isFree: false,
    price: 1200,
  },
  {
    key: "fallback-cps-303",
    code: "CPS-303",
    title: "অ্যালগরিদম ও গ্রাফ স্ট্র্যাটেজি",
    description:
      "BFS, DFS আর ডায়নামিক প্রোগ্রামিং-এর মাধ্যমে জটিল প্রবলেমে জেতার কৌশল।",
    level: "ADVANCED",
    tags: ["graphs", "dp", "search"],
    lessons: 40,
    isFree: false,
    price: 1800,
  },
  {
    key: "fallback-cps-401",
    code: "CPS-401",
    title: "CP রেটিং বুটক্যাম্প",
    description:
      "কনটেস্ট সিমুলেশন আর টাইম-ম্যানেজমেন্ট দিয়ে রেটিং ওঠানোর ফুল প্রোগ্রাম।",
    level: "ADVANCED",
    tags: ["contests", "strategy"],
    lessons: 18,
    isFree: false,
    price: 2500,
  },
];

export async function getFeaturedCourses(): Promise<FeaturedCourse[]> {
  try {
    const res = await apiClient<FeaturedCoursesResponse>(
      "/api/public/featured-courses",
    );
    const data = Array.isArray(res.data) ? res.data : [];
    if (data.length > 0) {
      return data.map(mapCourse).slice(0, 4);
    }
  } catch (err) {
    console.error("[courses] Failed to fetch featured courses", err);
  }
  return FALLBACK_FEATURED_COURSES;
}
