import "server-only";
import { apiClient } from "@/lib/apiClient";
import type {
  StrapiListResponse,
  StrapiSingleResponse,
  Enrollment,
  LessonProgress,
  Quiz,
  QuizAttempt,
  Course,
  Lesson,
} from "./types";

const STRAPI_URL = process.env.API_URL!;

/** Absolute URL for a Strapi media path (already absolute if it starts with http). */
export function strapiMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${STRAPI_URL}${path}`;
}

// Enrollment – My Courses

/**
 * Fetch all active enrollments for the authenticated student, with course
 * thumbnail, instructor, and lessons (id + order only for progress calc).
 */
export async function getMyEnrollments(token: string, studentDocId?: string) {
  const studentFilter = studentDocId
    ? `&filters[student][documentId][$eq]=${studentDocId}`
    : "";
  return apiClient<StrapiListResponse<Enrollment>>(
    `/api/enrollments?` +
      // thumbnail — select only the fields we use; avoid =* which triggers Strapi v5 "related" key error
      `populate[course][populate][thumbnail][fields][0]=url` +
      `&populate[course][populate][thumbnail][fields][1]=alternativeText` +
      `&populate[course][populate][thumbnail][fields][2]=formats` +
      // instructor — only name fields, no avatar/relations
      `&populate[course][populate][instructor][fields][0]=username` +
      `&populate[course][populate][instructor][fields][1]=fullName` +
      // lessons — id + order for progress calculation
      `&populate[course][populate][lessons][fields][0]=id` +
      `&populate[course][populate][lessons][fields][1]=order` +
      `&populate[course][populate][lessons][fields][2]=title` +
      `&filters[enrollment_status][$in][0]=active` +
      `&filters[enrollment_status][$in][1]=completed` +
      `&pagination[pageSize]=50` +
      studentFilter,
    { token },
  );
}

// ---------------------------------------------------------------------------
// Course detail (lesson list)
// ---------------------------------------------------------------------------

/**
 * Fetch a single course with its full ordered lesson list.
 */
export async function getCourseWithLessons(courseId: string, token: string) {
  return apiClient<StrapiSingleResponse<Course & { lessons: Lesson[] }>>(
    `/api/courses/${courseId}?` +
      `populate[lessons][sort][0]=order:asc` +
      // thumbnail — explicit fields to avoid Strapi v5 "related" key error on upload type
      `&populate[thumbnail][fields][0]=url` +
      `&populate[thumbnail][fields][1]=alternativeText` +
      `&populate[thumbnail][fields][2]=formats` +
      // instructor — only the name fields we display
      `&populate[instructor][fields][0]=username` +
      `&populate[instructor][fields][1]=fullName` +
      `&populate[instructor][fields][2]=email`,
    { token },
  );
}

// Lesson detail

export async function getLesson(lessonId: string, token: string) {
  return apiClient<StrapiSingleResponse<Lesson>>(
    `/api/lessons/${lessonId}` +
      `?fields[0]=title` +
      `&fields[1]=slug` +
      `&fields[2]=order` +
      `&fields[3]=duration` +
      `&fields[4]=videoUrl` +
      `&fields[5]=content` +
      `&fields[6]=createdAt` +
      `&fields[7]=updatedAt`,
    { token },
  );
}

// Lesson progress

/**
 * Fetch all lesson-progress records for the current student in a given course.
 * Strapi's `is-owner-or-admin` policy ensures only the student's own records
 * are returned.
 */
export async function getLessonProgresses(courseId: string, token: string) {
  return apiClient<StrapiListResponse<LessonProgress>>(
    `/api/lesson-progresses?filters[course][documentId][$eq]=${courseId}&populate[lesson][fields][0]=id&populate[lesson][fields][1]=documentId&populate[lesson][fields][2]=order&pagination[pageSize]=200`,
    { token },
  );
}

/**
 * Fetch the first published quiz belonging to a course (with full questions).
 * Returns null if none found.
 */
export async function getQuizForCourse(
  courseId: string,
  token: string,
): Promise<(Quiz & { id: number; documentId: string }) | null> {
  const res = await apiClient<StrapiListResponse<Quiz>>(
    `/api/quizzes?filters[course][documentId][$eq]=${courseId}` +
      `&populate[questions][populate][options]=*` +
      `&fields[0]=title` +
      `&fields[1]=description` +
      `&fields[2]=passingScore` +
      `&fields[3]=timeLimit` +
      `&fields[4]=maxAttempts` +
      `&pagination[pageSize]=1`,
    { token },
  );
  return res.data[0] ?? null;
}

/**
 * Build a map of { courseDocId -> completedLessonCount } for an array of
 * enrollments.  Used by both the overview and my-courses pages to avoid
 * duplicating the Promise.all pattern.
 */
export async function buildProgressMap(
  enrollments: { course?: { documentId: string } | null }[],
  token: string,
): Promise<Record<string, number>> {
  const progressMap: Record<string, number> = {};
  await Promise.all(
    enrollments.map(async (enrollment) => {
      const courseDocId = enrollment.course?.documentId;
      if (!courseDocId) return;
      try {
        const progressRes = await getLessonProgresses(courseDocId, token);
        progressMap[courseDocId] = progressRes.data.filter((p) => p.completed).length;
      } catch {
        progressMap[courseDocId] = 0;
      }
    }),
  );
  return progressMap;
}

/**
 * Update the lastAccessedAt timestamp of the active enrollment for a given course.
 * This is called when a student opens the course page or views any lesson page.
 */
export async function touchEnrollmentLastAccessed(
  courseDocId: string,
  studentDocId: string,
  token: string,
): Promise<void> {
  try {
    const enrollmentsRes = await apiClient<{ data: Array<{ id: number; documentId: string }> }>(
      `/api/enrollments` +
        `?filters[student][documentId][$eq]=${studentDocId}` +
        `&filters[course][documentId][$eq]=${courseDocId}` +
        `&pagination[pageSize]=1`,
      { token },
    );
    const enrollment = enrollmentsRes.data[0];
    if (enrollment) {
      await apiClient(`/api/enrollments/${enrollment.documentId}`, {
        method: "PUT",
        token,
        body: {
          data: {
            lastAccessedAt: new Date().toISOString(),
          },
        },
      });
    }
  } catch (err) {
    console.error("[api] Failed to touch enrollment lastAccessedAt", err);
  }
}

// Quiz attempts

export async function getMyQuizAttempts(quizId: string, token: string) {
  return apiClient<StrapiListResponse<QuizAttempt>>(
    `/api/quiz-attempts?filters[quiz][documentId][$eq]=${quizId}&sort[0]=createdAt:desc&pagination[pageSize]=10`,
    { token },
  );
}

/**
 * Fetch all quiz attempts submitted by the current authenticated student.
 */
export async function getAllMyQuizAttempts(
  token: string,
  studentDocId?: string,
) {
  const studentFilter = studentDocId
    ? `&filters[student][documentId][$eq]=${studentDocId}`
    : "";
  return apiClient<StrapiListResponse<QuizAttempt>>(
    `/api/quiz-attempts?sort[0]=createdAt:desc&pagination[pageSize]=100${studentFilter}`,
    { token },
  );
}

/**
 * Fetch all lesson progress records for the current student across ALL courses.
 */
export async function getAllMyLessonProgresses(
  token: string,
  studentDocId?: string,
) {
  const studentFilter = studentDocId
    ? `&filters[student][documentId][$eq]=${studentDocId}`
    : "";
  return apiClient<StrapiListResponse<LessonProgress>>(
    `/api/lesson-progresses?pagination[pageSize]=250${studentFilter}`,
    { token },
  );
}
