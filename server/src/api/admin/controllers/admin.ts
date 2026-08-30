import type { Core } from "@strapi/strapi";

type Context = {
  state: {
    user?: User;
  };
  unauthorized: (message?: string) => void;
  forbidden: (message?: string) => void;
  badRequest: (message?: string) => void;
  body?: unknown;
  status?: number;
};

type RoleLike = {
  name?: string | null;
} | null;

interface UserWithRole {
  documentId?: string | null;
  role?: RoleLike;
}

interface User {
  documentId?: string | null;
  role?: RoleLike;
}

interface UsersByRole {
  [roleName: string]: number;
}

interface StatsResponse {
  data: {
    usersByRole: UsersByRole;
    totalCourses: number;
    totalEnrollments: number;
    totalQuizAttempts: number;
  };
}

interface Instructor {
  documentId: string | null;
  username: string;
  fullName: string | null;
  email: string;
}

interface UploadedFile {
  id: number;
  documentId: string;
  name: string;
  url: string;
}

type AllowedRole = "Admin" | "Content Manager" | "Instructor";

interface AdminControllers {
  stats(ctx: Context): Promise<void>;
  instructors(ctx: Context): Promise<void>;
  uploadCourseThumbnail(ctx: Context & { request: any }): Promise<void>;
  users(ctx: Context & { params?: { documentId?: string } }): Promise<void>;
  updateUserRole(ctx: Context & { params?: { documentId?: string }; request: any }): Promise<void>;
  toggleBlockUser(ctx: Context & { params?: { documentId?: string } }): Promise<void>;
  updateUser(ctx: Context & { params?: { documentId?: string }; request: any }): Promise<void>;
}

const getUserRole = async (
  strapi: Core.Strapi,
  documentId: string,
): Promise<string | null> => {
  const user = (await strapi
    .documents("plugin::users-permissions.user")
    .findOne({
      documentId,
      populate: ["role"],
    })) as UserWithRole | null;

  return user?.role?.name ?? null;
};

// Resolve the authenticated user and check they are allowed.
const resolveAllowedUser = async (
  ctx: Context,
  strapi: Core.Strapi,
  allowedRoles: AllowedRole[],
): Promise<string | null> => {
  const user = ctx.state.user as User | undefined;
  if (!user?.documentId) {
    ctx.unauthorized("You are not logged in");
    return null;
  }

  const roleName = await getUserRole(strapi, user.documentId);
  if (!roleName || !allowedRoles.includes(roleName as AllowedRole)) {
    ctx.forbidden("You are not allowed to perform this action");
    return null;
  }

  return roleName;
};

export default ({ strapi }: { strapi: Core.Strapi }): AdminControllers => ({
  async stats(ctx: Context): Promise<void> {
    try {
      const user = ctx.state.user as User | undefined;
      if (!user?.documentId) {
        return ctx.unauthorized("You are not logged in");
      }

      // Ensure the user has role populated
      const userWithRole = (await strapi
        .documents("plugin::users-permissions.user")
        .findOne({
          documentId: user.documentId,
          populate: ["role"],
        })) as UserWithRole | null;

      if (!userWithRole || userWithRole.role?.name !== "Admin") {
        return ctx.forbidden("Only admins can access this endpoint");
      }

      // Fetch aggregated counts
      // 1. Users by role
      const users = (await strapi
        .documents("plugin::users-permissions.user")
        .findMany({
          populate: ["role"],
          limit: 10000, // naive approach for now
        })) as User[];

      const usersByRole: UsersByRole = users.reduce(
        (acc: UsersByRole, u: User): UsersByRole => {
          const role = u.role?.name || "Unknown";
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        },
        {},
      );

      // 2. Total courses
      // The count queries below are the supported way in Strapi v5.
      const totalCourses: number = await strapi.db
        .query("api::course.course")
        .count();
      const totalEnrollments: number = await strapi.db
        .query("api::enrollment.enrollment")
        .count();
      const totalQuizAttempts: number = await strapi.db
        .query("api::quiz-attempt.quiz-attempt")
        .count();

      const response: StatsResponse = {
        data: {
          usersByRole,
          totalCourses,
          totalEnrollments,
          totalQuizAttempts,
        },
      };

      ctx.body = response;
    } catch (err) {
      ctx.body = err;
    }
  },

  async instructors(ctx: Context): Promise<void> {
    try {
      const roleName = await resolveAllowedUser(ctx, strapi, [
        "Admin",
        "Content Manager",
      ]);
      if (!roleName) return;

      const instructors = (await strapi
        .documents("plugin::users-permissions.user")
        .findMany({
          filters: {
            role: {
              name: {
                $eq: "Instructor",
              },
            },
          },
          fields: ["documentId", "username", "fullName", "email"],
          sort: [{ fullName: "asc" }],
          limit: 10000,
        })) as Instructor[];

      ctx.body = { data: instructors };
    } catch (err) {
      strapi.log.error("admin instructors endpoint failed");
      strapi.log.error(err);
      ctx.status = 500;
      ctx.body = {
        error: {
          message: "Unable to load instructors.",
        },
      };
    }
  },

  async users(
    ctx: Context & { params?: { documentId?: string } },
  ): Promise<void> {
    try {
      const user = ctx.state.user as User | undefined;
      if (!user?.documentId) return ctx.unauthorized('Not logged in');

      const callerWithRole = (await strapi
        .documents('plugin::users-permissions.user')
        .findOne({ documentId: user.documentId, populate: ['role'] })) as UserWithRole | null;

      if (callerWithRole?.role?.name !== 'Admin') {
        return ctx.forbidden('Admin only');
      }

      const allUsers = (await strapi
        .documents('plugin::users-permissions.user')
        .findMany({
          populate: ['role'],
          fields: ['documentId', 'username', 'fullName', 'email', 'blocked', 'createdAt'],
          sort: [{ createdAt: 'desc' }],
          limit: 10000,
        })) as Array<{
        documentId: string;
        username: string;
        fullName: string | null;
        email: string;
        blocked: boolean;
        createdAt: string;
        role?: RoleLike;
      }>;

      ctx.body = {
        data: allUsers.map((u) => ({
          documentId: u.documentId,
          username: u.username,
          fullName: u.fullName ?? null,
          email: u.email,
          blocked: !!u.blocked,
          createdAt: u.createdAt,
          role: { name: u.role?.name ?? 'Unknown' },
        })),
      };
    } catch (err) {
      strapi.log.error('admin users endpoint failed');
      strapi.log.error(err);
      ctx.status = 500;
      ctx.body = { error: { message: 'Unable to load users.' } };
    }
  },

  async updateUserRole(
    ctx: Context & { params?: { documentId?: string }; request: any },
  ): Promise<void> {
    try {
      const caller = ctx.state.user as User | undefined;
      if (!caller?.documentId) return ctx.unauthorized('Not logged in');

      const callerWithRole = (await strapi
        .documents('plugin::users-permissions.user')
        .findOne({ documentId: caller.documentId, populate: ['role'] })) as UserWithRole | null;

      if (callerWithRole?.role?.name !== 'Admin') return ctx.forbidden('Admin only');

      const targetDocId = ctx.params?.documentId;
      if (!targetDocId) return ctx.badRequest('Missing documentId');

      const { role: roleName } = ctx.request.body as { role?: string };
      const allowed = ['Admin', 'Instructor', 'Content Manager', 'Student'];
      if (!roleName || !allowed.includes(roleName)) {
        return ctx.badRequest(`role must be one of: ${allowed.join(', ')}`);
      }

      // Resolve role entity
      const roles = await strapi
        .query('plugin::users-permissions.role')
        .findMany({ where: { name: roleName }, limit: 1 });
      const roleEntity = roles[0] as { id: number } | undefined;
      if (!roleEntity) return ctx.badRequest(`Role "${roleName}" not found`);

      // Resolve target user
      const target = (await strapi
        .documents('plugin::users-permissions.user')
        .findOne({ documentId: targetDocId })) as { id: number } | null;
      if (!target) return ctx.badRequest('User not found');

      await strapi
        .query('plugin::users-permissions.user')
        .update({ where: { id: target.id }, data: { role: roleEntity.id } });

      ctx.body = { data: { message: 'Role updated successfully' } };
    } catch (err) {
      strapi.log.error('updateUserRole failed');
      strapi.log.error(err);
      ctx.status = 500;
      ctx.body = { error: { message: 'Unable to update role.' } };
    }
  },

  async toggleBlockUser(
    ctx: Context & { params?: { documentId?: string } },
  ): Promise<void> {
    try {
      const caller = ctx.state.user as User | undefined;
      if (!caller?.documentId) return ctx.unauthorized('Not logged in');

      const callerWithRole = (await strapi
        .documents('plugin::users-permissions.user')
        .findOne({ documentId: caller.documentId, populate: ['role'] })) as UserWithRole | null;

      if (callerWithRole?.role?.name !== 'Admin') return ctx.forbidden('Admin only');

      const targetDocId = ctx.params?.documentId;
      if (!targetDocId) return ctx.badRequest('Missing documentId');

      if (targetDocId === caller.documentId) {
        return ctx.badRequest('You cannot block yourself');
      }

      const target = (await strapi
        .documents('plugin::users-permissions.user')
        .findOne({ documentId: targetDocId })) as { id: number; blocked: boolean } | null;
      if (!target) return ctx.badRequest('User not found');

      const newBlocked = !target.blocked;
      await strapi
        .query('plugin::users-permissions.user')
        .update({ where: { id: target.id }, data: { blocked: newBlocked } });

      ctx.body = { data: { blocked: newBlocked } };
    } catch (err) {
      strapi.log.error('toggleBlockUser failed');
      strapi.log.error(err);
      ctx.status = 500;
      ctx.body = { error: { message: 'Unable to toggle block.' } };
    }
  },

  async updateUser(
    ctx: Context & { params?: { documentId?: string }; request: any },
  ): Promise<void> {
    try {
      const caller = ctx.state.user as User | undefined;
      if (!caller?.documentId) return ctx.unauthorized('Not logged in');

      const callerWithRole = (await strapi
        .documents('plugin::users-permissions.user')
        .findOne({ documentId: caller.documentId, populate: ['role'] })) as UserWithRole | null;

      if (callerWithRole?.role?.name !== 'Admin') return ctx.forbidden('Admin only');

      const targetDocId = ctx.params?.documentId;
      if (!targetDocId) return ctx.badRequest('Missing documentId');

      const { fullName, username, email } = ctx.request.body as {
        fullName?: string;
        username?: string;
        email?: string;
      };

      if (!fullName && !username && !email) {
        return ctx.badRequest('At least one of fullName, username, or email is required');
      }

      const target = (await strapi
        .documents('plugin::users-permissions.user')
        .findOne({ documentId: targetDocId })) as { id: number } | null;
      if (!target) return ctx.badRequest('User not found');

      const updateData: Record<string, unknown> = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;

      await strapi
        .query('plugin::users-permissions.user')
        .update({ where: { id: target.id }, data: updateData });

      ctx.body = { data: { message: 'User updated successfully' } };
    } catch (err) {
      strapi.log.error('updateUser failed');
      strapi.log.error(err);
      ctx.status = 500;
      ctx.body = { error: { message: 'Unable to update user.' } };
    }
  },

  async uploadCourseThumbnail(
    ctx: Context & { request: { files?: { files?: unknown[] } | undefined } },
  ): Promise<void> {
    try {
      const roleName = await resolveAllowedUser(ctx, strapi, [
        "Admin",
        "Content Manager",
        "Instructor",
      ]);
      if (!roleName) return;

      const requestFiles = ctx.request.files?.files;
      const file = Array.isArray(requestFiles) ? requestFiles[0] : requestFiles;

      if (!file || typeof file !== "object") {
        return ctx.badRequest("Thumbnail image is required");
      }

      const f = file as {
        mimetype?: string;
        filepath?: string;
        size?: number;
      };

      const isImage =
        typeof f.mimetype === "string" &&
        (f.mimetype.startsWith("image/") ||
          f.mimetype === "application/octet-stream");

      if (!isImage) {
        return ctx.badRequest("Thumbnail must be an image file");
      }

      const uploadService = strapi.plugin("upload").service("upload");
      const apiUploadFolderService = strapi
        .plugin("upload")
        .service("api-upload-folder");
      const apiUploadFolder = await apiUploadFolderService.getAPIUploadFolder();

      const uploaded = (await uploadService.upload({
        data: {
          fileInfo: { folder: apiUploadFolder?.id },
        },
        files: [file],
      })) as UploadedFile[];

      const result = uploaded[0];
      if (!result) {
        return ctx.badRequest("Failed to upload thumbnail");
      }

      ctx.body = {
        data: {
          id: result.id,
          documentId: result.documentId,
          name: result.name,
          url: result.url,
        },
      };
    } catch (err) {
      strapi.log.error("admin course thumbnail upload failed");
      strapi.log.error(err);
      ctx.status = 500;
      ctx.body = {
        error: {
          message: "Unable to upload thumbnail.",
        },
      };
    }
  },
});
