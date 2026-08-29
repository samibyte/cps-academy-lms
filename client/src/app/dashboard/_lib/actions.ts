"use server";

import { requireAuth } from "./auth";
import {
  createBlogPost,
  deleteBlogPost,
  createQuiz,
  updateQuiz,
  createLesson,
  updateLesson,
  deleteLesson,
} from "./api";

// BLOG POSTS

export async function createBlogPostAction(values: Record<string, unknown>) {
  const { token } = await requireAuth(["Admin", "Content Manager"]);
  return createBlogPost(values, token);
}

export async function deleteBlogPostAction(id: string) {
  const { token } = await requireAuth(["Admin", "Content Manager"]);
  return deleteBlogPost(id, token);
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
