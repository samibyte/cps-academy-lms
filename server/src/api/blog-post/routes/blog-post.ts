/**
 * blog-post router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::blog-post.blog-post', {
  config: {
    create: {
      policies: ['global::is-owner-or-admin'],
    },
    update: {
      policies: ['global::is-owner-or-admin'],
    },
    delete: {
      policies: ['global::is-owner-or-admin'],
    },
  },
});
