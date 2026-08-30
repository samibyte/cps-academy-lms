export default {
  routes: [
    {
      method: 'GET',
      path: '/admin/stats',
      handler: 'admin.stats',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/admin/instructors',
      handler: 'admin.instructors',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/admin/course-thumbnail',
      handler: 'admin.uploadCourseThumbnail',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
