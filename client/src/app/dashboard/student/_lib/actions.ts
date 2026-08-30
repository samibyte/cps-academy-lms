"use server";

import { cookies } from "next/headers";
import { apiClient, ApiError } from "@/lib/apiClient";
import type {
  StrapiSingleResponse,
  LessonProgress,
  QuizAttempt,
  Quiz,
} from "./types";

//  Auth helper

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) throw new Error("No auth token");
  return token;
}

// ─── Shared enrollment helper ─────────────────────────────────────────────────

/**
 * Marks an enrollment as "completed" by doing a direct PUT.
 * Caller is responsible for any guard logic (e.g. checking all lessons are
 * done). Non-fatal — errors are logged rather than thrown.
 */
async function markEnrollmentComplete(
  token: string,
  courseDocId: string,
  studentDocId: string,
  nowIso: string,
): Promise<void> {
  try {
    const enrollmentsRes = await apiClient<{
      data: Array<{ id: number; documentId: string }>;
    }>(
      `/api/enrollments` +
        `?filters[student][documentId][$eq]=${studentDocId}` +
        `&filters[course][documentId][$eq]=${courseDocId}` +
        `&filters[enrollment_status][$eq]=active` +
        `&pagination[pageSize]=1`,
      { token },
    );
    const enrollment = enrollmentsRes.data[0];
    if (enrollment) {
      await apiClient(`/api/enrollments/${enrollment.documentId}`, {
        method: "PUT",
        token,
        body: { data: { enrollment_status: "completed", completedAt: nowIso } },
      });
    }
  } catch (err) {
    console.error("[enrollment] Failed to mark enrollment complete", err);
  }
}

/**
 * After a lesson is marked complete, checks whether ALL lessons in the course
 * are now done. If so, and there is no quiz for the course, auto-completes
 * the enrollment.
 */
async function checkAndMarkEnrollmentCompleteIfNoQuiz(
  token: string,
  courseDocId: string,
  studentDocId: string,
  nowIso: string,
): Promise<void> {
  try {
    // 1. Fetch lesson list from the course
    const courseRes = await apiClient<{
      data: { lessons?: Array<{ documentId: string }> };
    }>(`/api/courses/${courseDocId}?populate[lessons][fields][0]=documentId`, {
      token,
    });
    const courseLessons = courseRes.data?.lessons ?? [];
    if (courseLessons.length === 0) return;

    // 2. Fetch completed progresses for this student + course
    const progressesRes = await apiClient<{
      data: Array<{
        completed?: boolean;
        lesson?: { documentId: string } | null;
      }>;
    }>(
      `/api/lesson-progresses?filters[course][documentId][$eq]=${courseDocId}&filters[student][documentId][$eq]=${studentDocId}&pagination[pageSize]=200&populate[lesson][fields][0]=documentId`,
      { token },
    );
    const completedDocIds = new Set(
      progressesRes.data
        .filter((p) => p.completed)
        .map((p) => p.lesson?.documentId),
    );

    const allDone = courseLessons.every((l) =>
      completedDocIds.has(l.documentId),
    );
    if (!allDone) return;

    // 3. Only auto-complete when there is no quiz
    const quizRes = await apiClient<{ data: unknown[] }>(
      `/api/quizzes?filters[course][documentId][$eq]=${courseDocId}&pagination[pageSize]=1`,
      { token },
    );
    if (quizRes.data.length === 0) {
      await markEnrollmentComplete(token, courseDocId, studentDocId, nowIso);
    }
  } catch (err) {
    console.error("[enrollment] Failed auto-completion check", err);
  }
}

// ─── Lesson completion ────────────────────────────────────────────────────────

interface MarkCompleteResult {
  success: boolean;
  message: string;
  documentId?: string;
}

/**
 * Upsert a lesson-progress record to `completed: true`.
 * • If no existing record → POST
 * • If existing but incomplete → PUT
 * • If already complete → no-op
 */
export async function markLessonCompleteAction(
  lessonDocId: string,
  studentDocId: string,
  courseDocId: string,
): Promise<MarkCompleteResult> {
  try {
    const token = await getToken();

    const existing = await apiClient<{ data: LessonProgress[] }>(
      `/api/lesson-progresses?filters[lesson][documentId][$eq]=${lessonDocId}&filters[course][documentId][$eq]=${courseDocId}&filters[student][documentId][$eq]=${studentDocId}&pagination[pageSize]=1`,
      { token },
    );

    const record = existing.data[0];

    if (record?.completed) {
      return {
        success: true,
        message: "Already completed",
        documentId: record.documentId,
      };
    }

    const now = new Date().toISOString();

    if (record) {
      const res = await apiClient<StrapiSingleResponse<LessonProgress>>(
        `/api/lesson-progresses/${record.documentId}`,
        {
          method: "PUT",
          token,
          body: {
            data: { completed: true, completedAt: now, lastViewedAt: now },
          },
        },
      );
      await checkAndMarkEnrollmentCompleteIfNoQuiz(
        token,
        courseDocId,
        studentDocId,
        now,
      );
      return {
        success: true,
        message: "Lesson marked complete",
        documentId: res.data.documentId,
      };
    }

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
    await checkAndMarkEnrollmentCompleteIfNoQuiz(
      token,
      courseDocId,
      studentDocId,
      now,
    );
    return {
      success: true,
      message: "Lesson marked complete",
      documentId: res.data.documentId,
    };
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : "Failed to mark lesson complete";
    return { success: false, message };
  }
}

//  Quiz attempt submission

export interface SubmitQuizPayload {
  quizDocId: string;
  /** documentId of the course — used to mark enrollment complete after passing */
  courseDocId: string;
  studentDocId: string;
  answers: Record<number, string>;
  /** ISO timestamp of when the student started the quiz (from sessionStorage) */
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
  gradedQuestions?: Array<{
    id: number;
    question: string;
    chosenOption: string;
    isCorrect: boolean;
  }>;
}

export async function submitQuizAttemptAction(
  payload: SubmitQuizPayload,
): Promise<SubmitQuizResult> {
  try {
    const token = await getToken();

    // 1. Fetch quiz (questions + passingScore + timeLimit + maxAttempts)
    const quizRes = await apiClient<StrapiSingleResponse<Quiz>>(
      `/api/quizzes/${payload.quizDocId}?populate[questions][populate][options]=*` +
        `&fields[0]=passingScore&fields[1]=timeLimit&fields[2]=maxAttempts`,
      { token },
    );
    const quiz = quizRes.data;

    //  2. Server-side attempt-window check (defence-in-depth)
    // The Strapi policy `can-attempt-quiz` already blocks the POST, but this
    // provides a second layer in case the action is called via a server action
    // outside of the HTTP route.
    const attemptsRes = await apiClient<{
      data: Array<{ passed: boolean }>;
    }>(
      `/api/quiz-attempts?filters[quiz][documentId][$eq]=${payload.quizDocId}` +
        `&filters[student][documentId][$eq]=${payload.studentDocId}` +
        `&fields[0]=passed&pagination[pageSize]=50`,
      { token },
    );
    const existingAttempts = attemptsRes.data;
    const hasPassedBefore = existingAttempts.some((a) => a.passed);

    if (!hasPassedBefore && existingAttempts.length >= quiz.maxAttempts) {
      return {
        success: false,
        message: `তুমি ইতিমধ্যে ${quiz.maxAttempts}টি চেষ্টা ব্যবহার করে ফেলেছ এবং পাস করতে পারোনি। মেন্টরের সাথে যোগাযোগ করো।`,
      };
    }

    //  3. Time-limit enforcement
    const timeLimitSeconds = quiz.timeLimit;
    const startedAtMs = new Date(payload.startedAt).getTime();
    const submittedAtMs = Date.now();
    const timeTaken = Math.floor((submittedAtMs - startedAtMs) / 1000);

    const GRACE_PERIOD_SECONDS = 30;
    if (timeTaken > timeLimitSeconds + GRACE_PERIOD_SECONDS) {
      return {
        success: false,
        message: `সময়সীমা অতিক্রান্ত হয়েছে। সময় ছিল ${Math.floor(timeLimitSeconds / 60)} মিনিট, তুমি নিয়েছ ${Math.floor(timeTaken / 60)} মিনিট।`,
      };
    }

    //  4. Grade answers
    let score = 0;
    let totalPoints = 0;
    const gradedQuestions: SubmitQuizResult["gradedQuestions"] = [];

    for (const question of quiz.questions ?? []) {
      totalPoints += question.points;
      const chosen = payload.answers[question.id];
      const isCorrect = chosen === question.correctOption;
      if (isCorrect) score += question.points;
      gradedQuestions.push({
        id: question.id,
        question: question.question,
        chosenOption: chosen || "",
        isCorrect,
      });
    }

    const percentage =
      totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percentage >= quiz.passingScore;
    const now = new Date().toISOString();

    //  5. Persist attempt
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
            timeTaken,
          },
        },
      },
    );

    //  6. On pass → mark enrollment complete
    if (passed) {
      await markEnrollmentComplete(
        token,
        payload.courseDocId,
        payload.studentDocId,
        now,
      );
    }

    return {
      success: true,
      message: passed
        ? "অভিনন্দন! তুমি পাস করেছ!"
        : "আবার চেষ্টা করো! Better luck next time!",
      score,
      totalPoints,
      percentage,
      passed,
      gradedQuestions,
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
