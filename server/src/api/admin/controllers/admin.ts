import type { Core } from "@strapi/strapi";

type Context = {
  state: {
    user?: User;
  };
  unauthorized: (message?: string) => void;
  forbidden: (message?: string) => void;
  body?: unknown;
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

interface AdminControllers {
  stats(ctx: Context): Promise<void>;
}

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
});
