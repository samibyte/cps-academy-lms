/**
 * quiz-attempt router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::quiz-attempt.quiz-attempt', {
  config: {
    /**
     * `can-attempt-quiz` runs before the create.
     * It validates:
     *  1. Student is enrolled in the quiz's course.
     *  2. Student field in body matches the authenticated user.
     *  3. Attempt-window rule: pass in ≤ maxAttempts → unlimited;
     *     fail all maxAttempts → blocked.
     */
    create: {
      policies: ['global::can-attempt-quiz'],
    },
    find: {
      policies: ['global::is-owner-or-admin'],
    },
    findOne: {
      policies: ['global::is-owner-or-admin'],
    },
    // Students cannot patch or delete their own attempts (immutable records).
    // Only admins can do so via the Admin panel (is-owner-or-admin bypasses for Admin role).
    update: {
      policies: ['global::is-owner-or-admin'],
    },
    delete: {
      policies: ['global::is-owner-or-admin'],
    },
  },
});

