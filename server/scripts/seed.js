'use strict';

/**
 * Strapi 5 seed script for the CPS-LMS project.
 *
 * - Reads dummy data from ./seed-data.json
 * - Wipes existing rows (children first) so the script is safely re-runnable
 * - Seeds every content type in dependency order, resolving { "$ref": ... }
 *   placeholders to the REAL documentId of the created parent entries
 *
 * Usage:  npm run seed   (from server/)
 */

const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const APP_DIR = path.resolve(__dirname, '..');
const DATA = require('./seed-data.json');

const USER_UID = 'plugin::users-permissions.user';

// Seed order: parents first so their documentIds exist for children.
const SEED_ORDER = [
  { key: 'users', uid: USER_UID, draftPublish: false },
  { key: 'courses', uid: 'api::course.course', draftPublish: true },
  { key: 'lessons', uid: 'api::lesson.lesson', draftPublish: true },
  { key: 'quizzes', uid: 'api::quiz.quiz', draftPublish: true },
  { key: 'blogPosts', uid: 'api::blog-post.blog-post', draftPublish: true },
  { key: 'enrollments', uid: 'api::enrollment.enrollment', draftPublish: true },
  { key: 'lessonProgresses', uid: 'api::lesson-progress.lesson-progress', draftPublish: true },
  { key: 'quizAttempts', uid: 'api::quiz-attempt.quiz-attempt', draftPublish: true },
];

// Component storage that is not a content type (cleaned explicitly).
const COMPONENT_TABLES = [
  'components_quiz_questions',
  'components_quiz_options',
];

// map: roles-permissions role type (e.g. "authenticated", "instructor") -> role documentId
const rolesByType = {};

// map: symbolic ref (e.g. "user.instructor-1") -> created entry (with real id/documentId)
const createdByRef = {};

function resolveRefs(value) {
  if (Array.isArray(value)) {
    return value.map(resolveRefs);
  }
  if (value && typeof value === 'object') {
    if (value.$ref) {
      const entry = createdByRef[value.$ref];
      if (!entry) {
        throw new Error(`Seed data references unknown "$ref": "${value.$ref}"`);
      }
      return entry.documentId;
    }
    const result = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = resolveRefs(v);
    }
    return result;
  }
  return value;
}

async function seedEntries(app, { key, uid, draftPublish }) {
  const entries = DATA[key] || [];

  for (const raw of entries) {
    const ref = raw._ref;
    const data = { ...raw };
    delete data._ref;
    const roleType = data._role;
    delete data._role;

    const payload = resolveRefs(data);

    let created;
    if (uid === USER_UID) {
      // Seed-time "_role" picks the actual up_roles entry; fall back to the
      // default "authenticated" role if the entry did not specify one.
      payload.role = rolesByType[roleType] ?? rolesByType.authenticated;
      if (!payload.role) {
        throw new Error(`No usable role for user "${ref}". Seed the roles first.`);
      }
      // users-permissions service hashes the password for us
      created = await app.plugin('users-permissions').service('user').add(payload);
    } else {
      created = await app.documents(uid).create({
        data: payload,
        ...(draftPublish ? { status: 'published' } : {}),
      });
    }

    if (ref) {
      createdByRef[ref] = created;
    }

    console.log(
      `  created [${key}] ${ref || ''} id=${created.id} documentId=${created.documentId}`
    );
  }
}

async function clean(app) {
  console.log('Cleaning existing data...');
  // Children first, so FK constraints (through *_lnk join tables) never block.
  const order = [
    'api::quiz-attempt.quiz-attempt',
    'api::lesson-progress.lesson-progress',
    'api::enrollment.enrollment',
    'api::blog-post.blog-post',
    'api::quiz.quiz',
    'api::lesson.lesson',
    'api::course.course',
    USER_UID,
  ];

  for (const uid of order) {
    const { count } = await app.query(uid).deleteMany({ where: {} });
    console.log(`  removed ${count} from ${uid}`);
  }

  if (COMPONENT_TABLES.length > 0) {
    for (const table of COMPONENT_TABLES) {
      try {
        const deleted = await app.db.connection(table).delete();
        console.log(`  removed ${deleted} from ${table}`);
      } catch (err) {
        console.warn(`  could not clean ${table}: ${err.message}`);
      }
    }
  }
}

async function main() {
  const appContext = await compileStrapi({ appDir: APP_DIR });
  const app = await createStrapi({ ...appContext, appDir: APP_DIR }).load();
  app.log.level = 'error';

  try {
    // Resolve the up_roles entries referenced by the role types used in the
    // seed data (authenticated/instructor/content_manager/admin).
    const rolesToResolve = [
      { type: 'authenticated', required: true },
      { type: 'instructor' },
      { type: 'content_manager' },
      { type: 'admin' },
    ];
    for (const { type, required } of rolesToResolve) {
      const found = await app.query('plugin::users-permissions.role').findOne({
        where: { type },
      });
      if (!found && required) {
        throw new Error(`Default "${type}" role not found.`);
      }
      if (found) {
        rolesByType[type] = found.documentId ?? found.id;
      }
    }

    await clean(app);

    console.log('Seeding data...');
    for (const spec of SEED_ORDER) {
      await seedEntries(app, spec);
    }

    console.log('\nDone. Summary:');
    for (const { key, uid } of SEED_ORDER) {
      const count = await app.query(uid).count();
      console.log(`  ${uid}: ${count} row(s)`);
    }
  } finally {
    await app.destroy();
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});