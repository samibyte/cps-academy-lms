/**
 * lesson-progress router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::lesson-progress.lesson-progress', {
  config: {
    create: {
      policies: ['global::is-owner-or-admin'],
    },
    find: {
      policies: ['global::is-owner-or-admin'],
    },
    findOne: {
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

