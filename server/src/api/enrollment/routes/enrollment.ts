/**
 * enrollment router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::enrollment.enrollment', {
  config: {
    find: {
      policies: ['global::enrollment-access'],
    },
    findOne: {
      policies: ['global::enrollment-access'],
    },
    create: {
      policies: ['global::enrollment-access'],
    },
    update: {
      policies: ['global::enrollment-access'],
    },
    delete: {
      policies: ['global::enrollment-access'],
    },
  },
});
