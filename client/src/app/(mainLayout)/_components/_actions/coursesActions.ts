"use server";

import { cookies } from "next/headers";
import { apiClient } from "@/lib/apiClient";
import {
  type FeaturedCourse,
  type FeaturedCoursesResponse,
  type PaginatedCoursesResponse,
  type GetCoursesQuery,
  type CourseLevel,
  type StrapiCourse,
  mapCourse,
  FALLBACK_FEATURED_COURSES,
} from "../_lib/courses";

export async function getFeaturedCourses(): Promise<FeaturedCourse[]> {
  try {
    const res = await apiClient<FeaturedCoursesResponse>(
      "/api/public/featured-courses",
      {
        cache: "force-cache",
        next: { revalidate: 60 },
      },
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

export async function getPagedCourses(
  query: GetCoursesQuery = {}
): Promise<PaginatedCoursesResponse> {
  const params = new URLSearchParams();
  if (query.search) {
    params.append("search", query.search);
  }
  if (query.level) {
    const backendLevelMap: Record<CourseLevel, string> = {
      BEGINNER: "Beginner",
      INTERMEDIATE: "Intermediate",
      ADVANCED: "Advanced",
    };
    params.append("level", backendLevelMap[query.level]);
  }
  if (query.page) {
    params.append("page", String(query.page));
  }
  if (query.pageSize) {
    params.append("pageSize", String(query.pageSize));
  }

  const queryString = params.toString() ? `?${params.toString()}` : "";

  try {
    const res = await apiClient<{
      data: StrapiCourse[];
      meta: {
        pagination: {
          page: number;
          pageSize: number;
          pageCount: number;
          total: number;
        };
      };
    }>(`/api/public/courses${queryString}`, {
      cache: "force-cache",
      next: { revalidate: 60 },
    });

    const data = Array.isArray(res.data) ? res.data : [];
    const mapped = data.map((course, idx) => {
      const pageOffset = ((query.page || 1) - 1) * (query.pageSize || 8);
      return mapCourse(course, pageOffset + idx);
    });

    return {
      data: mapped,
      meta: res.meta || {
        pagination: {
          page: query.page || 1,
          pageSize: query.pageSize || 8,
          pageCount: 1,
          total: mapped.length,
        },
      },
    };
  } catch (err) {
    console.error("[courses] Failed to fetch paginated courses", err);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 8,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

export async function checkEnrollmentStatusAction(courseDocId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) {
      return { status: "unauthenticated" as const };
    }

    const me = await apiClient<{ id: number; documentId: string }>("/api/users/me", { token });
    if (!me || !me.documentId) {
      return { status: "unauthenticated" as const };
    }

    const enrollmentsRes = await apiClient<{
      data: Array<{ id: number; documentId: string; enrollment_status: string }>;
    }>(
      `/api/enrollments` +
        `?filters[student][documentId][$eq]=${me.documentId}` +
        `&filters[course][documentId][$eq]=${courseDocId}` +
        `&filters[enrollment_status][$in][0]=active` +
        `&filters[enrollment_status][$in][1]=completed` +
        `&pagination[pageSize]=1`,
      { token },
    );

    if (enrollmentsRes.data && enrollmentsRes.data.length > 0) {
      return {
        status: "enrolled" as const,
        enrollment: enrollmentsRes.data[0],
      };
    }

    return {
      status: "not_enrolled" as const,
      studentDocId: me.documentId,
    };
  } catch (err) {
    console.error("[courses] checkEnrollmentStatusAction failed", err);
    return { status: "unauthenticated" as const };
  }
}

export async function enrollCourseAction(courseDocId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) {
      return { success: false, error: "UNAUTHORIZED" };
    }

    const me = await apiClient<{ id: number; documentId: string }>("/api/users/me", { token });
    if (!me || !me.documentId) {
      return { success: false, error: "UNAUTHORIZED" };
    }

    await apiClient("/api/enrollments", {
      method: "POST",
      token,
      body: {
        data: {
          student: me.documentId,
          course: courseDocId,
          enrollment_status: "active",
          publishedAt: new Date().toISOString(), // In Strapi 5 drafting, need to set publishedAt if draftAndPublish is active
        },
      },
    });

    return { success: true };
  } catch (err) {
    console.error("[courses] enrollCourseAction failed", err);
    return { success: false, error: "FAILED_TO_ENROLL" };
  }
}

export async function getPublicCourseBySlug(slug: string) {
  try {
    const res = await apiClient<{ data: StrapiCourse }>(
      "/api/public/courses/" + encodeURIComponent(slug),
      {
        cache: "force-cache",
        next: { revalidate: 60 },
      },
    );
    if (res.data) {
      return mapCourse(res.data, 0);
    }
    return null;
  } catch (err) {
    console.error("[courses] getPublicCourseBySlug failed", err);
    return null;
  }
}


