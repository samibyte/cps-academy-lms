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
  body?: { data?: any };
  query?: Record<string, any>;
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

interface DocumentsService {
  findOne<T>(options: {
    documentId: string;
    populate?: string[];
  }): Promise<T | null>;
  findMany<T>(options: { filters: any; limit?: number }): Promise<T[]>;
}

interface Strapi {
  log: { info(m: string): void; warn(m: string): void; error(m: string): void };
  documents(uid: string): DocumentsService;
}

/**
 * enrollment-access policy
 *
 * Governance for the `/api/enrollments` core CRUD routes based on role:
 *   Admin            → full access.
 *   Content Manager  → read-only list/find (they curate content, not users).
 *   Instructor       → read-only list of enrollments for THEIR OWN courses.
 *   Student          → only their own enrollments: list, self-enroll (create),
 *                      and update their own enrollment (progress/status).
 *   Others           → denied.
 */
export default async (
  policyContext: PolicyContext,
  _config: unknown,
  { strapi }: { strapi: Strapi },
): Promise<boolean> => {
  strapi.log.info('In enrollment-access policy.');

  const user = policyContext.state.user;
  if (!user) {
    strapi.log.warn('enrollment-access: unauthenticated request.');
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
      strapi.log.warn('enrollment-access: user has no document ID.');
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

  const handler = (policyContext.state.route as Route)?.handler ?? '';
  const action = handler.split('.').pop();

  const isUserMatchingInput = (userInput: any): boolean => {
    if (!userInput) return false;
    const matches = (val: any) =>
      val === user.id ||
      val === user.documentId ||
      String(val) === String(user.id) ||
      String(val) === String(user.documentId);
    if (typeof userInput === 'string' || typeof userInput === 'number') {
      return matches(userInput);
    }
    if (Array.isArray(userInput)) return userInput.every((i) => matches(i));
    if (typeof userInput === 'object') {
      if (userInput.connect) return isUserMatchingInput(userInput.connect);
      if (userInput.set) return isUserMatchingInput(userInput.set);
      if (userInput.documentId !== undefined) return matches(userInput.documentId);
      if (userInput.id !== undefined) return matches(userInput.id);
    }
    return false;
  };

  // Student self-filter in a list query (student must appear in the filters).
  const unwrapFilter = (value: any): any => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (value.$eq !== undefined) return value.$eq;
      if (value.$in !== undefined) return value.$in;
    }
    return value;
  };
  const hasSelfStudentFilter = (filters: any): boolean => {
    if (!filters || typeof filters !== 'object') return false;
    const student = filters.student;
    if (student === undefined || student === null) return false;

    // Handle the keyed form { documentId: { $eq } } | { id: { $eq } }.
    if (typeof student === 'object' && !Array.isArray(student)) {
      if (student.documentId !== undefined) {
        const raw = unwrapFilter(student.documentId);
        const list = Array.isArray(raw) ? raw : [raw];
        return list.some((item) => isUserMatchingInput(item));
      }
      if (student.id !== undefined) {
        const raw = unwrapFilter(student.id);
        const list = Array.isArray(raw) ? raw : [raw];
        return list.some((item) => isUserMatchingInput(item));
      }
    }
    const raw = unwrapFilter(student);
    const list = Array.isArray(raw) ? raw : [raw];
    return list.some((item) => isUserMatchingInput(item));
  };

  // Admin — full control
  if (roleName === 'Admin') return true;

  // Content Manager — read-only
  if (roleName === 'Content Manager') {
    return action === 'find' || action === 'findOne';
  }

  // Instructor — read-only, and only for their own courses.
  // Course ownership is resolved at find-time via the course filter.
  if (roleName === 'Instructor') {
    if (action === 'find' || action === 'findOne') {
      const filters = policyContext.request.query?.filters;
      const course = filters?.course;
      if (!course) return false;
      const courseDocId = unwrapFilter(
        course && typeof course === 'object' ? course.documentId : course,
      );
      const courseId = Array.isArray(courseDocId)
        ? courseDocId[0]
        : courseDocId;
      if (!courseId) return false;
      const found = await strapi
        .documents('api::course.course')
        .findOne<any>({ documentId: courseId, populate: ['instructor'] });
      return !!(
        found &&
        found.instructor &&
        (found.instructor.id === user.id ||
          found.instructor.documentId === user.documentId)
      );
    }
    return false;
  }

  // Student — own enrollments only
  if (roleName === 'Student') {
    if (action === 'find' || action === 'findOne') {
      return hasSelfStudentFilter(policyContext.request.query?.filters);
    }

    if (action === 'create') {
      const { data } = policyContext.request.body || {};
      if (!data || data.student === undefined) return false;
      return isUserMatchingInput(data.student);
    }

    if (action === 'update' || action === 'delete') {
      const { id } = policyContext.params;
      if (!id) return false;
      const record = await strapi
        .documents('api::enrollment.enrollment')
        .findOne<any>({ documentId: id, populate: ['student'] });
      if (!record || !record.student) return false;
      return (
        record.student.id === user.id ||
        record.student.documentId === user.documentId
      );
    }

    return false;
  }

  return false;
};
