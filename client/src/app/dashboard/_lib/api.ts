import "server-only";
import { apiClient, ApiError } from "@/lib/apiClient";
import type {
  StrapiListResponse,
  StrapiSingleResponse,
  Course,
  Lesson,
  Quiz,
  Enrollment,
  LessonProgress,
  BlogPost,
  AdminUser,
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

export interface InstructorSummary {
  documentId: string;
  username: string;
  fullName: string | null;
  email: string;
}

export async function getInstructors(token: string) {
  const res = await apiClient<{ data: InstructorSummary[] }>(
    `/api/admin/instructors`,
    { token },
  );
  return res.data;
}

export async function uploadCourseThumbnail(file: File, token: string) {
  const body = new FormData();
  body.append("files", file);

  const res = await fetch(`${STRAPI_URL}/api/admin/course-thumbnail`, {
    method: "POST",
    cache: "no-store",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message =
      data?.error?.message ?? data?.message ?? `Upload error: ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<{
    data: { id: number; documentId: string; name: string; url: string };
  }>;
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

export async function createCourse(data: Record<string, unknown>, token: string) {
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

// QUIZZES

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

export async function getBlogPosts(token: string, status: "published" | "draft" = "published") {
  return apiClient<StrapiListResponse<BlogPost>>(
    `/api/blog-posts?populate[author][fields][0]=username&populate[author][fields][1]=fullName&populate[coverImage][fields][0]=url&populate[coverImage][fields][1]=name&sort[0]=createdAt:desc&pagination[pageSize]=100&status=${status}`,
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

export async function publishBlogPost(
  id: string,
  publish: boolean,
  token: string,
) {
  // Uses a custom admin endpoint that calls Strapi's document service
  // publish/unpublish internally, avoiding RBAC issues with the built-in routes.
  return apiClient<{ data: { published: boolean } }>(
    `/api/admin/blog-posts/${id}/toggle-publish`,
    {
      method: "POST",
      token,
      body: { publish },
    },
  );
}

export async function deleteBlogPost(id: string, token: string) {
  return apiClient(`/api/blog-posts/${id}`, {
    method: "DELETE",
    token,
  });
}

// ADMIN USER MANAGEMENT

export async function getAdminUsers(token: string) {
  const res = await apiClient<{ data: AdminUser[] }>("/api/admin/users", { token });
  return res.data;
}

export async function adminUpdateUser(
  documentId: string,
  data: { fullName?: string; username?: string; email?: string },
  token: string
) {
  return apiClient<{ data: { message: string } }>(`/api/admin/users/${documentId}`, {
    method: "PUT",
    token,
    body: data,
  });
}

export async function adminUpdateUserRole(
  documentId: string,
  role: string,
  token: string
) {
  return apiClient<{ data: { message: string } }>(`/api/admin/users/${documentId}/role`, {
    method: "PUT",
    token,
    body: { role },
  });
}

export async function adminToggleBlockUser(
  documentId: string,
  token: string
) {
  return apiClient<{ data: { blocked: boolean } }>(`/api/admin/users/${documentId}/block`, {
    method: "PUT",
    token,
  });
}
