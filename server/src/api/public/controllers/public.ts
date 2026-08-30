import type { Core } from "@strapi/strapi";

interface PublicStatsResponse {
  data: {
    totalCourses: number;
    totalStudents: number;
    totalLessons: number;
  };
}

type PublicController = {
  stats: (ctx: any) => Promise<void>;
  featuredCourses: (ctx: any) => Promise<void>;
};

export default ({ strapi }: { strapi: Core.Strapi }): PublicController => ({
  async stats(ctx: any): Promise<void> {
    try {
      const [totalCourses, totalStudents, totalLessons] = await Promise.all([
        strapi.db.query("api::course.course").count(),
        strapi.documents("plugin::users-permissions.user").count({
          filters: {
            role: {
              name: {
                $eq: "Student",
              },
            },
          },
        }),
        strapi.db.query("api::lesson.lesson").count(),
      ]);

      const response: PublicStatsResponse = {
        data: {
          totalCourses,
          totalStudents,
          totalLessons,
        },
      };

      ctx.body = response;
    } catch (error) {
      strapi.log.error("public stats endpoint failed");
      strapi.log.error(error);
      ctx.status = 500;
      ctx.body = {
        error: {
          message: "Unable to load public stats.",
        },
      };
    }
  },

  async featuredCourses(ctx: any): Promise<void> {
    try {
      const courses = await strapi.documents("api::course.course").findMany({
        filters: {
          isFeatured: {
            $eq: true,
          },
        },
        populate: ["thumbnail", "instructor", "lessons"],
        sort: [{ createdAt: "desc" }],
      });

      ctx.body = {
        data: courses,
      };
    } catch (error) {
      strapi.log.error("public featured courses endpoint failed");
      strapi.log.error(error);
      ctx.status = 500;
      ctx.body = {
        error: {
          message: "Unable to load featured courses.",
        },
      };
    }
  },
});
