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
  courses: (ctx: any) => Promise<void>;
  courseBySlug: (ctx: any) => Promise<void>;
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

  async courses(ctx: any): Promise<void> {
    try {
      const { search, level, page, pageSize } = ctx.query;

      const filters: any = {};
      if (level) {
        filters.level = { $eq: level };
      }
      if (search) {
        filters.$or = [
          { title: { $containsi: search } },
          { shortDescription: { $containsi: search } },
        ];
      }

      const currentPage = Number(page) || 1;
      const currentPageSize = Number(pageSize) || 8;

      const [data, total] = await Promise.all([
        strapi.documents("api::course.course").findMany({
          filters,
          populate: ["thumbnail", "instructor", "lessons"],
          sort: [{ createdAt: "desc" }],
          start: (currentPage - 1) * currentPageSize,
          limit: currentPageSize,
        }),
        strapi.documents("api::course.course").count({ filters }),
      ]);

      ctx.body = {
        data,
        meta: {
          pagination: {
            page: currentPage,
            pageSize: currentPageSize,
            pageCount: Math.ceil(total / currentPageSize),
            total,
          },
        },
      };
    } catch (error) {
      strapi.log.error("public courses endpoint failed");
      strapi.log.error(error);
      ctx.status = 500;
      ctx.body = {
        error: {
          message: "Unable to load courses.",
        },
      };
    }
  },

  async courseBySlug(ctx: any): Promise<void> {
    try {
      const { slug } = ctx.params;
      const course = await strapi.documents("api::course.course").findFirst({
        filters: { slug: { $eq: slug } },
        populate: ["thumbnail", "instructor", "lessons"],
      });

      if (!course) {
        ctx.status = 404;
        ctx.body = {
          error: {
            message: "Course not found.",
          },
        };
        return;
      }

      ctx.body = {
        data: course,
      };
    } catch (error) {
      strapi.log.error("public course by slug endpoint failed");
      strapi.log.error(error);
      ctx.status = 500;
      ctx.body = {
        error: {
          message: "Unable to load course.",
        },
      };
    }
  },
});
