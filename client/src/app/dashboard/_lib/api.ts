import "server-only";
import { apiClient } from "@/lib/apiClient";
import type {
  StrapiListResponse,
  StrapiSingleResponse,
  Course,
  Lesson,
  Quiz,
  Enrollment,
  LessonProgress,
  QuizAttempt,
  BlogPost,
} from "./types";

const STRAPI_URL = process.env.API_URL!;

export function strapiMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${STRAPI_URL}${path}`;
}

// COURSES

export async function getCoursesByInstructor(
  token: string,
  instructorDocId: string,
) {
  return apiClient<StrapiListResponse<Course>>(
    `/api/courses?` +
      `filters[instructor][documentId][$eq]=${instructorDocId}` +
      `&populate[thumbnail][fields][0]=url` +
      `&populate[thumbnail][fields][1]=alternativeText` +
      `&populate[thumbnail][fields][2]=formats` +
      `&populate[instructor][fields][0]=username` +
      `&populate[instructor][fields][1]=fullName` +
      `&pagination[pageSize]=100`,
    { token },
  );
}

export async function getAllCourses(token: string) {
  return apiClient<StrapiListResponse<Course>>(
    `/api/courses?` +
      `populate[thumbnail][fields][0]=url` +
      `&populate[thumbnail][fields][1]=alternativeText` +
      `&populate[thumbnail][fields][2]=formats` +
      `&populate[instructor][fields][0]=username` +
      `&populate[instructor][fields][1]=fullName` +
      `&pagination[pageSize]=1000`,
    { token },
  );
}

export async function getCourseWithLessons(courseId: string, token: string) {
  return apiClient<StrapiSingleResponse<Course>>(
    `/api/courses/${courseId}?` +
      `populate[lessons][sort][0]=order:asc` +
      `&populate[thumbnail][fields][0]=url` +
      `&populate[thumbnail][fields][1]=alternativeText` +
      `&populate[thumbnail][fields][2]=formats` +
      `&populate[instructor][fields][0]=username` +
      `&populate[instructor][fields][1]=fullName` +
      `&populate[instructor][fields][2]=email`,
    { token },
  );
}

export async function createCourse(data: Partial<Course>, token: string) {
  return apiClient<StrapiSingleResponse<Course>>(`/api/courses`, {
    method: "POST",
    token,
    body: { data },
  });
}

export async function updateCourse(
  id: string,
  data: Partial<Course>,
  token: string,
) {
  return apiClient<StrapiSingleResponse<Course>>(`/api/courses/${id}`, {
    method: "PUT",
    token,
    body: { data },
  });
}

export async function deleteCourse(id: string, token: string) {
  return apiClient(`/api/courses/${id}`, {
    method: "DELETE",
    token,
  });
}

// LESSONS

export async function getLessonsForCourse(courseId: string, token: string) {
  return apiClient<StrapiListResponse<Lesson>>(
    `/api/lessons?filters[course][documentId][$eq]=${courseId}&sort[0]=order:asc&pagination[pageSize]=100`,
    { token },
  );
}

export async function createLesson(data: Partial<Lesson>, token: string) {
  return apiClient<StrapiSingleResponse<Lesson>>(`/api/lessons`, {
    method: "POST",
    token,
    body: { data },
  });
}

export async function updateLesson(
  id: string,
  data: Partial<Lesson>,
  token: string,
) {
  return apiClient<StrapiSingleResponse<Lesson>>(`/api/lessons/${id}`, {
    method: "PUT",
    token,
    body: { data },
  });
}

export async function deleteLesson(id: string, token: string) {
  return apiClient(`/api/lessons/${id}`, {
    method: "DELETE",
    token,
  });
}

// ─── QUIZZES ─────────────────────────────────────────────────────────────────────

export async function getQuizForCourseAdmin(courseId: string, token: string) {
  const res = await apiClient<StrapiListResponse<Quiz>>(
    `/api/quizzes?filters[course][documentId][$eq]=${courseId}` +
      `&populate[questions][populate][options]=*` +
      `&pagination[pageSize]=1`,
    { token },
  );
  return res.data[0] || null;
}

export async function createQuiz(data: Partial<Quiz>, token: string) {
  return apiClient<StrapiSingleResponse<Quiz>>(`/api/quizzes`, {
    method: "POST",
    token,
    body: { data },
  });
}

export async function updateQuiz(
  id: string,
  data: Partial<Quiz>,
  token: string,
) {
  return apiClient<StrapiSingleResponse<Quiz>>(`/api/quizzes/${id}`, {
    method: "PUT",
    token,
    body: { data },
  });
}

// PROGRESS / ENROLLMENTS

export async function getStudentProgressForCourse(
  courseId: string,
  token: string,
) {
  // Finds all enrollments for a specific course
  const enrollmentsRes = await apiClient<StrapiListResponse<Enrollment>>(
    `/api/enrollments?filters[course][documentId][$eq]=${courseId}&populate[student][fields][0]=username&populate[student][fields][1]=fullName&pagination[pageSize]=1000`,
    { token },
  );

  // Finds all progress records for a specific course
  const progressRes = await apiClient<StrapiListResponse<LessonProgress>>(
    `/api/lesson-progresses?filters[course][documentId][$eq]=${courseId}&populate[student][fields][0]=documentId&populate[lesson][fields][0]=id&pagination[pageSize]=10000`,
    { token },
  );

  return { enrollments: enrollmentsRes.data, progress: progressRes.data };
}

// BLOG POSTS

export async function getBlogPosts(token: string) {
  return apiClient<StrapiListResponse<BlogPost>>(
    `/api/blog-posts?populate[author][fields][0]=username&populate[author][fields][1]=fullName&sort[0]=createdAt:desc&pagination[pageSize]=100`,
    { token },
  );
}

export async function createBlogPost(data: Partial<BlogPost>, token: string) {
  return apiClient<StrapiSingleResponse<BlogPost>>(`/api/blog-posts`, {
    method: "POST",
    token,
    body: { data },
  });
}

export async function updateBlogPost(
  id: string,
  data: Partial<BlogPost>,
  token: string,
) {
  return apiClient<StrapiSingleResponse<BlogPost>>(`/api/blog-posts/${id}`, {
    method: "PUT",
    token,
    body: { data },
  });
}

export async function deleteBlogPost(id: string, token: string) {
  return apiClient(`/api/blog-posts/${id}`, {
    method: "DELETE",
    token,
  });
}
