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

interface PolicyRequest {
  body?: {
    data?: any;
  };
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
  request: PolicyRequest;
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
  }): Promise<T[]>;
}

interface Strapi {
  log: StrapiLogger;
  documents(uid: string): DocumentsService;
}

interface PolicyConfig {
  [key: string]: unknown;
}

export default async (
  policyContext: PolicyContext,
  config: PolicyConfig,
  { strapi }: { strapi: Strapi }
): Promise<boolean> => {
  strapi.log.info('In is-owner-or-admin policy.');

  const user = policyContext.state.user;
  if (!user) {
    strapi.log.warn('Access denied: No authenticated user found.');
    return false;
  }

  if (user.documentId === undefined) {
    strapi.log.warn(`Access denied: User ${user.id} has no document ID.`);
    return false;
  }

  // Retrieve user with role populated
  const userWithRole = await strapi
    .documents('plugin::users-permissions.user')
    .findOne<UserWithRole>({
      documentId: user.documentId,
      populate: ['role'],
    });

  if (!userWithRole || !userWithRole.role) {
    strapi.log.warn(`Access denied: User ${user.id} has no associated role.`);
    return false;
  }

  const roleName = userWithRole.role.name;

  // Admins and Content Managers bypass ownership check
  if (roleName === 'Admin' || roleName === 'Content Manager') {
    return true;
  }

  const { route } = policyContext.state;
  if (!route) {
    strapi.log.error('Policy error: route context is missing.');
    return false;
  }

  // Determine content type UID and action from route.handler
  // Handler format: e.g. "api::lesson.lesson.findOne"
  const handler = route.handler;
  const parts = handler.split('.');
  const uid = parts.slice(0, 2).join('.'); // e.g. "api::course.course", "api::lesson.lesson"
  const action = parts.pop();

  const isUserMatchingInput = (userInput: any): boolean => {
    if (!userInput) return false;

    const matches = (val: string | number) => {
      return (
        val === user.id ||
        val === user.documentId ||
        String(val) === String(user.id) ||
        String(val) === String(user.documentId)
      );
    };

    if (typeof userInput === 'string' || typeof userInput === 'number') {
      return matches(userInput);
    }

    if (Array.isArray(userInput)) {
      return userInput.every((item) => isUserMatchingInput(item));
    }

    if (typeof userInput === 'object') {
      if (userInput.connect) {
        return isUserMatchingInput(userInput.connect);
      }
      if (userInput.id !== undefined) {
        return matches(userInput.id);
      }
      if (userInput.documentId !== undefined) {
        return matches(userInput.documentId);
      }
    }

    return false;
  };

  // Helper to verify if an Instructor owns the course
  const checkCourseInstructorOwnership = (course: any): boolean => {
    if (!course || !course.instructor) return false;
    return (
      course.instructor.id === user.id ||
      course.instructor.documentId === user.documentId
    );
  };

  // --- Instructor Flow ---
  if (roleName === 'Instructor') {
    // 1. Course UID
    if (uid === 'api::course.course') {
      if (action === 'create') {
        const { data } = policyContext.request.body || {};
        if (!data || !data.instructor) return false;
        return isUserMatchingInput(data.instructor);
      }

      if (action === 'update' || action === 'delete' || action === 'findOne') {
        const { id } = policyContext.params;
        if (!id) return false;

        const course = await strapi
          .documents('api::course.course')
          .findOne<any>({
            documentId: id,
            populate: ['instructor'],
          });

        if (!course) return false;
        if (!checkCourseInstructorOwnership(course)) return false;

        if (action === 'update') {
          const { data } = policyContext.request.body || {};
          if (data && data.instructor !== undefined) {
            return isUserMatchingInput(data.instructor);
          }
        }
        return true;
      }
      return false;
    }

    // 2. Lesson / Quiz UID
    if (uid === 'api::lesson.lesson' || uid === 'api::quiz.quiz') {
      if (action === 'create') {
        const { data } = policyContext.request.body || {};
        if (!data || !data.course) return false;

        // Resolve parent course ID/document ID
        let courseDocId = '';
        if (typeof data.course === 'string') {
          courseDocId = data.course;
        } else if (data.course && typeof data.course === 'object') {
          if (data.course.connect && Array.isArray(data.course.connect) && data.course.connect[0]) {
            const conn = data.course.connect[0];
            courseDocId = typeof conn === 'object' ? conn.documentId : conn;
          } else if (data.course.documentId) {
            courseDocId = data.course.documentId;
          }
        }

        if (!courseDocId) return false;

        const course = await strapi
          .documents('api::course.course')
          .findOne<any>({
            documentId: courseDocId,
            populate: ['instructor'],
          });

        return checkCourseInstructorOwnership(course);
      }

      if (action === 'update' || action === 'delete' || action === 'findOne') {
        const { id } = policyContext.params;
        if (!id) return false;

        const record = await strapi
          .documents(uid)
          .findOne<any>({
            documentId: id,
            populate: ['course', 'course.instructor'],
          });

        if (!record || !record.course) return false;
        return checkCourseInstructorOwnership(record.course);
      }
      return false;
    }

    // 3. Lesson Progress / Quiz Attempt
    if (uid === 'api::lesson-progress.lesson-progress' || uid === 'api::quiz-attempt.quiz-attempt') {
      if (action === 'findOne' || action === 'find') {
        const { id } = policyContext.params;
        if (!id) return true;

        const record = await strapi
          .documents(uid)
          .findOne<any>({
            documentId: id,
            populate: uid === 'api::lesson-progress.lesson-progress'
              ? ['course', 'course.instructor']
              : ['quiz', 'quiz.course', 'quiz.course.instructor'],
          });

        if (!record) return false;
        const course = uid === 'api::lesson-progress.lesson-progress' ? record.course : record.quiz?.course;
        return checkCourseInstructorOwnership(course);
      }

      return false;
    }

    return false;
  }

  // --- Student Flow ---
  if (roleName === 'Student') {
    if (uid === 'api::lesson-progress.lesson-progress' || uid === 'api::quiz-attempt.quiz-attempt') {
      if (action === 'create') {
        const { data } = policyContext.request.body || {};
        if (!data || !data.student) return false;

        return isUserMatchingInput(data.student);
      }

      if (action === 'update' || action === 'delete' || action === 'findOne') {
        const { id } = policyContext.params;
        if (!id) return false;

        const record = await strapi
          .documents(uid)
          .findOne<any>({
            documentId: id,
            populate: ['student'],
          });

        if (!record || !record.student) return false;
        return (
          record.student.id === user.id ||
          record.student.documentId === user.documentId
        );
      }
      return true;
    }

    return false;
  }

  return false;
};
