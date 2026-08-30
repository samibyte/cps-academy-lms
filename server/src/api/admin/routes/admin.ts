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
    {
      method: 'GET',
      path: '/admin/users',
      handler: 'admin.users',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/admin/users/:documentId/role',
      handler: 'admin.updateUserRole',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/admin/users/:documentId/block',
      handler: 'admin.toggleBlockUser',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/admin/users/:documentId',
      handler: 'admin.updateUser',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
