"use server";

import { requireAuth } from "./auth";
import {
  createCourse,
  deleteCourse,
  deleteBlogPost,
  createBlogPost,
  updateBlogPost,
  createQuiz,
  updateQuiz,
  createLesson,
  updateLesson,
  deleteLesson,
  uploadCourseThumbnail,
  adminUpdateUser,
  adminUpdateUserRole,
  adminToggleBlockUser,
} from "./api";
import { courseSchema } from "@/zod/course.validation";

export type CourseActionResult = { success: true } | { success: false; error: string };

function textToBlocks(text: string | undefined): unknown[] | null {
  const paragraphs = (text ?? "")
    .split(/\n+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;
  return paragraphs.map((p) => ({
    type: "paragraph",
    children: [{ type: "text", text: p }],
  }));
}

export async function createCourseAction(
  formData: FormData,
): Promise<CourseActionResult> {
  try {
    const { token, me } = await requireAuth([
      "Instructor",
      "Content Manager",
      "Admin",
    ]);

    const raw = {
      title: formData.get("title"),
      slug: formData.get("slug"),
      shortDescription: formData.get("shortDescription"),
      description: formData.get("description") || undefined,
      level: formData.get("level"),
      price: formData.get("price"),
      isFree: formData.get("isFree") === "true",
      isFeatured: formData.get("isFeatured") === "true",
      tags: jsonOr("tags", formData),
      instructor: formData.get("instructor") || undefined,
    };

    const parsed = courseSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid course data",
      };
    }

    const isStaff =
      me.role.name === "Admin" || me.role.name === "Content Manager";

    let instructor: string;
    if (me.role.name === "Instructor") {
      instructor = me.documentId;
    } else {
      instructor = typeof raw.instructor === "string" ? raw.instructor : "";
      if (!instructor) {
        return {
          success: false,
          error: "কোর্সের জন্য একজন ইনস্ট্রাক্টর নির্বাচন করুন।",
        };
      }
    }

    let thumbnailId: number | undefined;
    const thumbFile = formData.get("thumbnail");
    if (thumbFile instanceof File) {
      const res = await uploadCourseThumbnail(thumbFile, token);
      thumbnailId = res.data?.id;
    }

    const data: Record<string, unknown> = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      shortDescription: parsed.data.shortDescription,
      description: textToBlocks(parsed.data.description),
      level: parsed.data.level,
      price: parsed.data.price ?? 0,
      isFree: parsed.data.isFree,
      isFeatured: isStaff ? parsed.data.isFeatured : false,
      tags: parsed.data.tags ?? [],
      instructor,
    };
    if (thumbnailId !== undefined) data.thumbnail = thumbnailId;

    await createCourse(data, token);
    return { success: true };
  } catch (err: unknown) {
    console.error("Course creation failed", err);
    const message =
      err instanceof Error ? err.message : "Failed to create course";
    return { success: false, error: message };
  }
}

export async function deleteCourseAction(id: string): Promise<CourseActionResult> {
  try {
    const { token } = await requireAuth(["Instructor", "Content Manager", "Admin"]);
    await deleteCourse(id, token);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete course";
    return { success: false, error: message };
  }
}

function jsonOr(key: string, formData: FormData): unknown {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

// BLOG POSTS

export async function createBlogPostAction(values: Record<string, unknown>) {
  const { token } = await requireAuth(["Admin", "Content Manager"]);
  return createBlogPost(values, token);
}

export async function deleteBlogPostAction(id: string) {
  const { token } = await requireAuth(["Admin", "Content Manager"]);
  return deleteBlogPost(id, token);
}

export async function publishBlogPostAction(id: string, publish: boolean) {
  const { token } = await requireAuth(["Admin", "Content Manager"]);
  return updateBlogPost(id, { publishedAt: publish ? new Date().toISOString() : null }, token);
}
// QUIZZES

export async function createQuizAction(values: Record<string, unknown>) {
  const { token } = await requireAuth([
    "Admin",
    "Instructor",
    "Content Manager",
  ]);
  return createQuiz(values, token);
}

export async function updateQuizAction(
  id: string,
  values: Record<string, unknown>,
) {
  const { token } = await requireAuth([
    "Admin",
    "Instructor",
    "Content Manager",
  ]);
  return updateQuiz(id, values, token);
}

// LESSONS

export async function createLessonAction(values: Record<string, unknown>) {
  const { token } = await requireAuth([
    "Admin",
    "Instructor",
    "Content Manager",
  ]);
  return createLesson(values, token);
}

export async function updateLessonAction(
  id: string,
  values: Record<string, unknown>,
) {
  const { token } = await requireAuth([
    "Admin",
    "Instructor",
    "Content Manager",
  ]);
  return updateLesson(id, values, token);
}

export async function deleteLessonAction(id: string) {
  const { token } = await requireAuth([
    "Admin",
    "Instructor",
    "Content Manager",
  ]);
  return deleteLesson(id, token);
}

// USER MANAGEMENT ACTIONS

export async function updateUserRoleAction(
  documentId: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { token } = await requireAuth(["Admin"]);
    await adminUpdateUserRole(documentId, role, token);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update role" };
  }
}

export async function toggleBlockUserAction(
  documentId: string
): Promise<{ success: boolean; error?: string; blocked?: boolean }> {
  try {
    const { token } = await requireAuth(["Admin"]);
    const res = await adminToggleBlockUser(documentId, token);
    return { success: true, blocked: res.data?.blocked };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle block status" };
  }
}

export async function updateUserAction(
  documentId: string,
  data: { fullName?: string; username?: string; email?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { token } = await requireAuth(["Admin"]);
    await adminUpdateUser(documentId, data, token);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update user profile" };
  }
}

