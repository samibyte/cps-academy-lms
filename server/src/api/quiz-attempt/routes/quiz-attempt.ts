/**
 * quiz-attempt router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::quiz-attempt.quiz-attempt', {
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

