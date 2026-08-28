"use server";

import { cookies } from "next/headers";
import { apiClient, ApiError } from "@/lib/apiClient";
import type {
  StrapiSingleResponse,
  LessonProgress,
  QuizAttempt,
  Quiz,
} from "./types";

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) throw new Error("No auth token");
  return token;
}

// Mark a lesson as complete

interface MarkCompleteResult {
  success: boolean;
  message: string;
  documentId?: string;
}

/**
 * Upsert a lesson-progress record to `completed: true`.
 * - If no existing progress record: POST (create)
 * - If existing but not yet complete: PUT (update)
 * - If already complete: no-op, just return success
 */
export async function markLessonCompleteAction(
  lessonDocId: string,
  studentDocId: string,
  courseDocId: string,
): Promise<MarkCompleteResult> {
  try {
    const token = await getToken();

    // Check for an existing progress record for this lesson
    const existing = await apiClient<{ data: LessonProgress[] }>(
      `/api/lesson-progresses?filters[lesson][documentId][$eq]=${lessonDocId}&filters[course][documentId][$eq]=${courseDocId}&pagination[pageSize]=1`,
      { token },
    );

    const record = existing.data[0];

    if (record?.completed) {
      // Already complete – no-op
      return {
        success: true,
        message: "Already completed",
        documentId: record.documentId,
      };
    }

    const now = new Date().toISOString();

    if (record) {
      // Update existing record
      const res = await apiClient<StrapiSingleResponse<LessonProgress>>(
        `/api/lesson-progresses/${record.documentId}`,
        {
          method: "PUT",
          token,
          body: {
            data: {
              completed: true,
              completedAt: now,
              lastViewedAt: now,
            },
          },
        },
      );
      return {
        success: true,
        message: "Lesson marked complete",
        documentId: res.data.documentId,
      };
    } else {
      // Create new record
      const res = await apiClient<StrapiSingleResponse<LessonProgress>>(
        "/api/lesson-progresses",
        {
          method: "POST",
          token,
          body: {
            data: {
              lesson: lessonDocId,
              course: courseDocId,
              student: studentDocId,
              completed: true,
              completedAt: now,
              lastViewedAt: now,
            },
          },
        },
      );
      return {
        success: true,
        message: "Lesson marked complete",
        documentId: res.data.documentId,
      };
    }
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : "Failed to mark lesson complete";
    return { success: false, message };
  }
}

// Submit quiz attempt

export interface SubmitQuizPayload {
  quizDocId: string;
  studentDocId: string;
  answers: Record<number, string>;
  startedAt: string;
}

export interface SubmitQuizResult {
  success: boolean;
  message: string;
  score?: number;
  totalPoints?: number;
  percentage?: number;
  passed?: boolean;
  attempt?: QuizAttempt & { id: number; documentId: string };
}

export async function submitQuizAttemptAction(
  payload: SubmitQuizPayload,
): Promise<SubmitQuizResult> {
  try {
    const token = await getToken();

    // 1. Fetch the quiz to calculate score server-side
    const quizRes = await apiClient<StrapiSingleResponse<Quiz>>(
      `/api/quizzes/${payload.quizDocId}?populate[questions][populate][options]=*`,
      { token },
    );
    const quiz = quizRes.data;

    // 2. Grade answers
    let score = 0;
    let totalPoints = 0;

    for (const question of quiz.questions ?? []) {
      totalPoints += question.points;
      const chosen = payload.answers[question.id];
      if (chosen === question.correctOption) {
        score += question.points;
      }
    }

    const percentage =
      totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percentage >= quiz.passingScore;
    const now = new Date().toISOString();

    // 3. Persist attempt
    const attemptRes = await apiClient<StrapiSingleResponse<QuizAttempt>>(
      "/api/quiz-attempts",
      {
        method: "POST",
        token,
        body: {
          data: {
            quiz: payload.quizDocId,
            student: payload.studentDocId,
            answers: payload.answers,
            score,
            totalPoints,
            percentage,
            passed,
            startedAt: payload.startedAt,
            submittedAt: now,
          },
        },
      },
    );

    return {
      success: true,
      message: passed
        ? "Congratulations! You passed!"
        : "Better luck next time!",
      score,
      totalPoints,
      percentage,
      passed,
      attempt: attemptRes.data as QuizAttempt & {
        id: number;
        documentId: string;
      },
    };
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : "Failed to submit quiz";
    return { success: false, message };
  }
}
