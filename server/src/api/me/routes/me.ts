export default {
  routes: [
    {
      method: "PUT",
      path: "/users/me/avatar",
      handler: "me.updateAvatar",
      config: {
        auth: { strategies: ["users-permissions"] },
        policies: [],
        middlewares: [],
      },
    },
  ],
};
