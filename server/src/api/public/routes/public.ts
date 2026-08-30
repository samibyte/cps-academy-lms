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
  ],
};
