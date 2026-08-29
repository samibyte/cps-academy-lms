/**
 * can-attempt-quiz policy
 *
 * Gate-keeps POST /api/quiz-attempts.
 *
 * Rules enforced (Students only — Admins/Content Managers bypass all checks):
 *  1. The quiz must exist and be published.
 *  2. The student must be actively enrolled (or have completed) the course
 *     that the quiz belongs to.
 *  3. Attempt window rule:
 *       • If the student has passed the quiz at any point → unlimited retakes.
 *       • If the student has NOT yet passed AND has used all `maxAttempts` → blocked.
 *       • Otherwise → allow.
 */

interface PolicyUser {
  id: string | number;
  documentId?: string;
}

interface Role {
  name: string;
}

interface UserWithRole extends PolicyUser {
  role?: Role;
}

interface PolicyRequest {
  body?: {
    data?: {
      quiz?: string | { documentId?: string };
      student?: string | { documentId?: string };
    };
  };
}

interface PolicyState {
  user?: PolicyUser;
}

interface PolicyContext {
  state: PolicyState;
  request: PolicyRequest;
  /** Allow returning HTTP error responses */
  forbidden(message: string): void;
  badRequest(message: string): void;
}

interface DocumentsService {
  findOne<T>(options: { documentId: string; populate?: string[] }): Promise<T | null>;
  findMany<T>(options: { filters: Record<string, unknown>; fields?: string[] }): Promise<T[]>;
}

interface Strapi {
  log: { info(m: string): void; warn(m: string): void; error(m: string): void };
  documents(uid: string): DocumentsService;
}

export default async (
  policyContext: PolicyContext,
  _config: unknown,
  { strapi }: { strapi: Strapi },
): Promise<boolean> => {
  strapi.log.info('In can-attempt-quiz policy.');

  const user = policyContext.state.user;
  if (!user || user.documentId === undefined) {
    strapi.log.warn('can-attempt-quiz: unauthenticated request.');
    return false;
  }

  // ── Resolve role
  const userWithRole = await strapi
    .documents('plugin::users-permissions.user')
    .findOne<UserWithRole>({ documentId: user.documentId, populate: ['role'] });

  if (!userWithRole?.role) return false;
  const roleName = userWithRole.role.name;

  // Admins / Content Managers bypass all quiz-attempt restrictions
  if (roleName === 'Admin' || roleName === 'Content Manager') return true;

  // Only students may create attempts
  if (roleName !== 'Student') {
    strapi.log.warn(`can-attempt-quiz: role "${roleName}" is not allowed to create attempts.`);
    return false;
  }

  //  Resolve quiz documentId from request body 
  const body = policyContext.request.body?.data;
  if (!body?.quiz) {
    strapi.log.warn('can-attempt-quiz: missing quiz in request body.');
    return false;
  }

  const quizDocId =
    typeof body.quiz === 'string'
      ? body.quiz
      : (body.quiz as { documentId?: string }).documentId;

  if (!quizDocId) {
    strapi.log.warn('can-attempt-quiz: could not resolve quiz documentId.');
    return false;
  }

  //  Validate student field matches the authenticated user
  // Prevent one student from submitting an attempt on behalf of another.
  if (body.student) {
    const submittedStudentDocId =
      typeof body.student === 'string'
        ? body.student
        : (body.student as { documentId?: string }).documentId;

    if (
      submittedStudentDocId &&
      submittedStudentDocId !== user.documentId &&
      String(submittedStudentDocId) !== String(user.id)
    ) {
      strapi.log.warn(
        `can-attempt-quiz: student mismatch — body has ${submittedStudentDocId}, user is ${user.documentId}.`,
      );
      return false;
    }
  }

  //  Fetch the quiz (need course + maxAttempts) 
  const quiz = await strapi
    .documents('api::quiz.quiz')
    .findOne<{ maxAttempts: number; course?: { documentId: string } }>({
      documentId: quizDocId,
      populate: ['course'],
    });

  if (!quiz || !quiz.course) {
    strapi.log.warn(`can-attempt-quiz: quiz "${quizDocId}" not found or has no course.`);
    return false;
  }

  const courseDocId = quiz.course.documentId;
  const maxAttempts = quiz.maxAttempts ?? 3;

  // Enrollment check: student must be enrolled in this course 
  const enrollments = await strapi.documents('api::enrollment.enrollment').findMany<{
    enrollment_status: string;
  }>({
    filters: {
      student: { id: user.id },
      course: { documentId: courseDocId },
      enrollment_status: { $in: ['active', 'completed'] },
    },
  });

  if (enrollments.length === 0) {
    strapi.log.warn(
      `can-attempt-quiz: user ${user.documentId} is not enrolled in course ${courseDocId}.`,
    );
    return false;
  }

  //  Attempt-window check 
  const existingAttempts = await strapi
    .documents('api::quiz-attempt.quiz-attempt')
    .findMany<{ passed: boolean }>({
      filters: {
        quiz: { documentId: quizDocId },
        student: { id: user.id },
      },
      fields: ['passed'],
    });

  const hasPassedBefore = existingAttempts.some((a) => a.passed);

  // Passed at least once → unlimited retakes
  if (hasPassedBefore) return true;

  // Never passed — check if within trial window
  if (existingAttempts.length >= maxAttempts) {
    strapi.log.warn(
      `can-attempt-quiz: user ${user.documentId} has exhausted ${maxAttempts} attempts on quiz ${quizDocId} without passing.`,
    );
    return false;
  }

  return true;
};
