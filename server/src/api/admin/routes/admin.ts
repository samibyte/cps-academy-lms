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
  ],
};
