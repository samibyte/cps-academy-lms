import type { Core } from '@strapi/strapi';

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

interface Route {
  handler: string;
}

interface PolicyState {
  user?: PolicyUser;
  route?: Route;
}

interface PolicyParams {
  id?: string;
}

interface PolicyContext {
  state: PolicyState;
  params: PolicyParams;
}

interface StrapiLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

interface DocumentsService {
  findOne<T>(options: {
    documentId: string;
    populate: string[];
  }): Promise<T | null>;
  findMany<T>(options: {
    filters: any;
    limit?: number;
  }): Promise<T[]>;
}

interface Strapi {
  log: StrapiLogger;
  documents(uid: string): DocumentsService;
}

export default async (
  policyContext: PolicyContext,
  config: any,
  { strapi }: { strapi: Strapi }
): Promise<boolean> => {
  strapi.log.info('In is-enrolled policy.');

  const user = policyContext.state.user;
  if (!user) {
    strapi.log.warn('Access denied: No authenticated user found.');
    return false;
  }

  if (user.documentId === undefined) {
    const userRecord = await strapi
      .documents('plugin::users-permissions.user')
      .findMany<any>({
        filters: { id: user.id },
        limit: 1,
      });
    if (userRecord?.[0]?.documentId) {
      user.documentId = userRecord[0].documentId;
    } else {
      return false;
    }
  }

  const userWithRole = await strapi
    .documents('plugin::users-permissions.user')
    .findOne<UserWithRole>({
      documentId: user.documentId!,
      populate: ['role'],
    });

  if (!userWithRole || !userWithRole.role) return false;
  const roleName = userWithRole.role.name;

  if (roleName === 'Admin' || roleName === 'Content Manager') {
    return true;
  }

  const { route } = policyContext.state;
  if (!route) return false;

  const handler = route.handler;
  const parts = handler.split('.');
  const uid = parts.slice(0, 2).join('.'); // e.g. "api::course.course", "api::lesson.lesson"
  const { id } = policyContext.params;

  if (!id) {
    return true;
  }

  let courseDocId = '';

  // Resolve associated course document ID based on UID
  if (uid === 'api::course.course') {
    courseDocId = id;
  } else if (uid === 'api::lesson.lesson' || uid === 'api::quiz.quiz') {
    const record = await strapi.documents(uid).findOne<any>({
      documentId: id,
      populate: ['course'],
    });
    if (!record || !record.course) return false;
    courseDocId = record.course.documentId;
  } else if (uid === 'api::lesson-progress.lesson-progress') {
    const record = await strapi.documents(uid).findOne<any>({
      documentId: id,
      populate: ['course'],
    });
    if (!record || !record.course) return false;
    courseDocId = record.course.documentId;
  } else if (uid === 'api::quiz-attempt.quiz-attempt') {
    const record = await strapi.documents(uid).findOne<any>({
      documentId: id,
      populate: ['quiz', 'quiz.course'],
    });
    if (!record || !record.quiz || !record.quiz.course) return false;
    courseDocId = record.quiz.course.documentId;
  }

  if (!courseDocId) return false;

  // If Instructor: must be the instructor teaching this course
  if (roleName === 'Instructor') {
    const course = await strapi.documents('api::course.course').findOne<any>({
      documentId: courseDocId,
      populate: ['instructor'],
    });
    if (!course || !course.instructor) return false;
    return (
      course.instructor.id === user.id ||
      course.instructor.documentId === user.documentId
    );
  }

  // If Student: check active/completed enrollment
  if (roleName === 'Student') {
    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: {
        student: { id: user.id },
        course: { documentId: courseDocId },
        enrollment_status: { $in: ['active', 'completed'] },
      },
    });
    return enrollments.length > 0;
  }

  return false;
};
