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
