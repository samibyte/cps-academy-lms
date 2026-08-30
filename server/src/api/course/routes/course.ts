/**
 * course router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::course.course', {
  config: {
    create: {
      policies: ['global::is-owner-or-admin'],
    },
    findOne: {
      policies: ['global::is-enrolled'],
    },
    update: {
      policies: ['global::is-owner-or-admin'],
    },
    delete: {
      policies: ['global::is-owner-or-admin'],
    },
  },
});


