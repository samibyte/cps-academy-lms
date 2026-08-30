export default {
  routes: [
    {
      method: "GET",
      path: "/public/stats",
      handler: "public.stats",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/public/featured-courses",
      handler: "public.featuredCourses",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/public/courses",
      handler: "public.courses",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/public/courses/:slug",
      handler: "public.courseBySlug",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

