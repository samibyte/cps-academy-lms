
// Strapi v5 response envelope helpers


export interface StrapiItem<T> {
  id: number;
  documentId: string;
  attributes?: T;
}

/**
 * Generic Strapi v5 single response wrapper.
 */
export interface StrapiSingleResponse<T> {
  data: T & { id: number; documentId: string };
  meta: Record<string, unknown>;
}

/**
 * Generic Strapi v5 list response wrapper.
 */
export interface StrapiListResponse<T> {
  data: Array<T & { id: number; documentId: string }>;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}


// Domain types 


export interface CourseThumbnail {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
  formats?: {
    thumbnail?: { url: string };
    small?: { url: string };
    medium?: { url: string };
    large?: { url: string };
  };
}

export interface CourseInstructor {
  id: number;
  documentId: string;
  username: string;
  fullName: string | null;
  email: string;
}

export interface Course {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: BlocksContent | null;
  level: "Beginner" | "Intermediate" | "Advanced";
  price: number | null;
  isFree: boolean;
  tags: string[] | null;
  thumbnail: CourseThumbnail | null;
  instructor: CourseInstructor | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  order: number;
  duration: number | null; // minutes
  videoUrl: string | null;
  content: BlocksContent | null;
  createdAt: string;
  updatedAt: string;
}


export type BlocksContent = unknown[];

export interface EnrolledCourse extends Course {
  lessons: Lesson[];
}

export interface Enrollment {
  id: number;
  documentId: string;
  enrollment_status: "active" | "completed" | "cancelled";
  completedAt: string | null;
  lastAccessedAt: string | null;
  createdAt: string; // use as enrolledAt
  course: EnrolledCourse | null;
}

export interface LessonProgress {
  id: number;
  documentId: string;
  completed: boolean;
  completedAt: string | null;
  lastViewedAt: string;
  lesson: Pick<Lesson, "id" | "documentId" | "title" | "order"> | null;
  course: Pick<Course, "id" | "documentId"> | null;
}

export interface QuizOption {
  id: number;
  key: "A" | "B" | "C" | "D";
  value: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  points: number;
  order: number;
  correctOption: "A" | "B" | "C" | "D";
  options: QuizOption[];
}

export interface Quiz {
  id: number;
  documentId: string;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimit: number;
  maxAttempts: number;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: number;
  documentId: string;
  answers: Record<string, string>; // questionId → chosen option key
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  /** Elapsed time in **seconds** */
  timeTaken: number;
  startedAt: string;
  submittedAt: string;
  quiz: Pick<Quiz, "id" | "documentId"> | null;
}
