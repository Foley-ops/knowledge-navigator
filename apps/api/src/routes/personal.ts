import { z } from 'zod';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { DOTTED_ID } from '@navigator/core';
import { sendError } from '../errors.js';
import {
  MAX_PERSONAL_PAGE,
  PERSONAL_SCHEMA_VERSION,
  PersonalNotFoundError,
  PersonalValidationError,
  archiveNote,
  archiveProject,
  archiveSavedItem,
  archiveSession,
  clearFamiliarity,
  countNotes,
  countProjects,
  countSavedItems,
  countSessions,
  createNote,
  createProject,
  createSession,
  familiarityLevels,
  getFamiliarity,
  getProject,
  listFamiliarity,
  listNotes,
  listProjects,
  listSavedItems,
  listSessions,
  projectContents,
  restoreNote,
  restoreProject,
  restoreSavedItem,
  restoreSession,
  saveItem,
  savedItemTypes,
  setFamiliarity,
  updateNote,
  updateProject,
  updateSession,
} from '../personal/index.js';
import { PersonalUnavailableError } from '../personal/handle.js';

/**
 * Private personal data (v2 runbook N07).
 *
 * Every route here is an *explicit* action. There is no endpoint that records
 * what was browsed, searched or asked; the only way anything reaches this store
 * is a request the researcher made on purpose.
 *
 * Archive and restore replace DELETE throughout. Nothing regenerates a research
 * note, so the product does not offer a button that loses one.
 *
 * Nothing here is logged beyond a route, a status and a count — see
 * `logger.ts`, and the redaction audit in `personal-api.test.ts`.
 */

const projectIdParam = z.object({ projectId: z.string().uuid() });
const conceptIdParam = z.object({
  conceptId: z.string().regex(DOTTED_ID, 'concept id must be a lowercase dotted identifier'),
});

const listQuery = z.strictObject({
  includeArchived: z.enum(['', 'true', '1', 'false', '0']).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PERSONAL_PAGE).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

function truthy(value: string | undefined): boolean {
  return value === '' || value === 'true' || value === '1';
}

function invalid(
  request: FastifyRequest,
  reply: FastifyReply,
  issues: readonly { message: string; path: PropertyKey[] }[],
): FastifyReply {
  return sendError(request, reply, 400, 'invalid_request', 'The request is not valid.', {
    issues: issues.map((issue) =>
      issue.path.length > 0
        ? `${issue.path.map(String).join('.')}: ${issue.message}`
        : issue.message,
    ),
  });
}

function personalUnavailable(request: FastifyRequest, reply: FastifyReply): FastifyReply {
  const { personal } = request.server;
  return sendError(
    request,
    reply,
    503,
    'personal_store_unavailable',
    personal.message ?? 'The private research store is unavailable.',
    { reason: personal.reason ?? 'unknown' },
  );
}

/**
 * Run a handler, mapping the store's own errors onto HTTP.
 *
 * The error itself never reaches the response: a validation error carries the
 * field paths it complained about, and a not-found carries the id, neither of
 * which is private content.
 */
async function handle(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  run: () => unknown,
): Promise<unknown> {
  if (!app.personal.available) return personalUnavailable(request, reply);
  try {
    return reply.send(run());
  } catch (error) {
    if (error instanceof PersonalValidationError) {
      return sendError(request, reply, 400, 'invalid_request', 'The request is not valid.', {
        issues: error.issues,
      });
    }
    if (error instanceof PersonalNotFoundError) {
      return sendError(
        request,
        reply,
        404,
        'not_found',
        `No ${error.what} with id ${error.id} in this project.`,
      );
    }
    if (error instanceof PersonalUnavailableError) {
      return personalUnavailable(request, reply);
    }
    throw error;
  }
}

export async function registerPersonalRoutes(app: FastifyInstance): Promise<void> {
  const db = (): ReturnType<typeof app.personal.db.prepare> extends never
    ? never
    : typeof app.personal.db => app.personal.db;

  /* ------------------------------- status ------------------------------- */

  app.get('/api/personal/status', async (request, reply) => {
    if (!app.personal.available) {
      // Deliberately no path: the location of the private store is not a fact
      // a browser needs, and a health response is a place details leak from.
      return reply.code(503).send({
        available: false,
        reason: app.personal.reason,
        message: app.personal.message,
        requestId: request.id,
      });
    }
    const handle = db();
    return reply.send({
      available: true,
      schemaVersion: PERSONAL_SCHEMA_VERSION,
      counts: {
        projects: countProjects(handle, { includeArchived: true }),
        sessions: countSessions(handle),
        notes: countNotes(handle),
        savedItems: countSavedItems(handle),
      },
      requestId: request.id,
    });
  });

  /* ------------------------------ projects ------------------------------ */

  app.get('/api/personal/projects', async (request, reply) => {
    const query = listQuery.safeParse(request.query);
    if (!query.success) return invalid(request, reply, query.error.issues);
    return handle(app, request, reply, () => {
      const options = {
        includeArchived: truthy(query.data.includeArchived),
        limit: query.data.limit,
        offset: query.data.offset,
      };
      return {
        items: listProjects(db(), options),
        total: countProjects(db(), options),
      };
    });
  });

  app.post('/api/personal/projects', async (request, reply) =>
    handle(app, request, reply, () => createProject(db(), request.body)),
  );

  app.get('/api/personal/projects/:projectId', async (request, reply) => {
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    return handle(app, request, reply, () => ({
      project: getProject(db(), params.data.projectId),
      contents: projectContents(db(), params.data.projectId),
    }));
  });

  app.patch('/api/personal/projects/:projectId', async (request, reply) => {
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    return handle(app, request, reply, () =>
      updateProject(db(), params.data.projectId, request.body),
    );
  });

  for (const [action, run] of [
    ['archive', archiveProject],
    ['restore', restoreProject],
  ] as const) {
    app.post(`/api/personal/projects/:projectId/${action}`, async (request, reply) => {
      const params = projectIdParam.safeParse(request.params);
      if (!params.success) return invalid(request, reply, params.error.issues);
      return handle(app, request, reply, () => run(db(), params.data.projectId));
    });
  }

  /* ------------------------------ sessions ------------------------------ */

  const childParams = (extra: string) =>
    z.object({ projectId: z.string().uuid(), [extra]: z.string().uuid() });

  app.get('/api/personal/projects/:projectId/sessions', async (request, reply) => {
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    const query = listQuery.safeParse(request.query);
    if (!query.success) return invalid(request, reply, query.error.issues);
    return handle(app, request, reply, () => ({
      items: listSessions(db(), params.data.projectId, {
        includeArchived: truthy(query.data.includeArchived),
        limit: query.data.limit,
        offset: query.data.offset,
      }),
    }));
  });

  app.post('/api/personal/projects/:projectId/sessions', async (request, reply) => {
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    return handle(app, request, reply, () =>
      createSession(db(), params.data.projectId, request.body),
    );
  });

  const sessionParams = childParams('sessionId');
  app.patch('/api/personal/projects/:projectId/sessions/:sessionId', async (request, reply) => {
    const params = sessionParams.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    return handle(app, request, reply, () =>
      updateSession(
        db(),
        params.data['projectId'] as string,
        params.data['sessionId'] as string,
        request.body,
      ),
    );
  });

  for (const [action, run] of [
    ['archive', archiveSession],
    ['restore', restoreSession],
  ] as const) {
    app.post(
      `/api/personal/projects/:projectId/sessions/:sessionId/${action}`,
      async (request, reply) => {
        const params = sessionParams.safeParse(request.params);
        if (!params.success) return invalid(request, reply, params.error.issues);
        return handle(app, request, reply, () =>
          run(db(), params.data['projectId'] as string, params.data['sessionId'] as string),
        );
      },
    );
  }

  /* -------------------------------- notes ------------------------------- */

  const noteQuery = listQuery.extend({
    conceptId: z.string().regex(DOTTED_ID).optional(),
    sessionId: z.string().uuid().optional(),
  });

  app.get('/api/personal/projects/:projectId/notes', async (request, reply) => {
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    const query = noteQuery.safeParse(request.query);
    if (!query.success) return invalid(request, reply, query.error.issues);
    return handle(app, request, reply, () => ({
      items: listNotes(db(), params.data.projectId, {
        includeArchived: truthy(query.data.includeArchived),
        limit: query.data.limit,
        offset: query.data.offset,
        conceptId: query.data.conceptId,
        sessionId: query.data.sessionId,
      }),
    }));
  });

  app.post('/api/personal/projects/:projectId/notes', async (request, reply) => {
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    return handle(app, request, reply, () => createNote(db(), params.data.projectId, request.body));
  });

  const noteParams = childParams('noteId');
  app.patch('/api/personal/projects/:projectId/notes/:noteId', async (request, reply) => {
    const params = noteParams.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    return handle(app, request, reply, () =>
      updateNote(
        db(),
        params.data['projectId'] as string,
        params.data['noteId'] as string,
        request.body,
      ),
    );
  });

  for (const [action, run] of [
    ['archive', archiveNote],
    ['restore', restoreNote],
  ] as const) {
    app.post(
      `/api/personal/projects/:projectId/notes/:noteId/${action}`,
      async (request, reply) => {
        const params = noteParams.safeParse(request.params);
        if (!params.success) return invalid(request, reply, params.error.issues);
        return handle(app, request, reply, () =>
          run(db(), params.data['projectId'] as string, params.data['noteId'] as string),
        );
      },
    );
  }

  /* ----------------------------- saved items ---------------------------- */

  const savedQuery = listQuery.extend({
    itemType: z.enum(savedItemTypes).optional(),
    sessionId: z.string().uuid().optional(),
  });

  app.get('/api/personal/projects/:projectId/saved', async (request, reply) => {
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    const query = savedQuery.safeParse(request.query);
    if (!query.success) return invalid(request, reply, query.error.issues);
    return handle(app, request, reply, () => ({
      items: listSavedItems(db(), params.data.projectId, {
        includeArchived: truthy(query.data.includeArchived),
        limit: query.data.limit,
        offset: query.data.offset,
        itemType: query.data.itemType,
        sessionId: query.data.sessionId,
      }),
    }));
  });

  app.post('/api/personal/projects/:projectId/saved', async (request, reply) => {
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    return handle(app, request, reply, () => saveItem(db(), params.data.projectId, request.body));
  });

  const savedParams = childParams('savedId');
  for (const [action, run] of [
    ['archive', archiveSavedItem],
    ['restore', restoreSavedItem],
  ] as const) {
    app.post(
      `/api/personal/projects/:projectId/saved/:savedId/${action}`,
      async (request, reply) => {
        const params = savedParams.safeParse(request.params);
        if (!params.success) return invalid(request, reply, params.error.issues);
        return handle(app, request, reply, () =>
          run(db(), params.data['projectId'] as string, params.data['savedId'] as string),
        );
      },
    );
  }

  /* ----------------------------- familiarity ---------------------------- */

  app.get('/api/personal/familiarity', async (request, reply) => {
    const query = z
      .strictObject({ level: z.enum(familiarityLevels).optional() })
      .safeParse(request.query);
    if (!query.success) return invalid(request, reply, query.error.issues);
    return handle(app, request, reply, () => ({
      items: listFamiliarity(db(), query.data.level),
    }));
  });

  app.get('/api/personal/familiarity/:conceptId', async (request, reply) => {
    const params = conceptIdParam.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    return handle(app, request, reply, () => ({
      conceptId: params.data.conceptId,
      familiarity: getFamiliarity(db(), params.data.conceptId) ?? null,
    }));
  });

  app.post('/api/personal/familiarity/:conceptId', async (request, reply) => {
    const params = conceptIdParam.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    return handle(app, request, reply, () => {
      // Only a concept the corpus actually carries may be given a level: a
      // level on a name that does not exist would distort every path built
      // afterwards. When the index is unavailable the check is skipped rather
      // than guessed at.
      const known = app.index.available
        ? new Set(
            (app.index.db.prepare('SELECT id FROM concepts').all() as { id: string }[]).map(
              (row) => row.id,
            ),
          )
        : undefined;
      return setFamiliarity(db(), params.data.conceptId, request.body, {
        knownConceptIds: known,
      });
    });
  });

  app.post('/api/personal/familiarity/:conceptId/clear', async (request, reply) => {
    const params = conceptIdParam.safeParse(request.params);
    if (!params.success) return invalid(request, reply, params.error.issues);
    return handle(app, request, reply, () => ({
      conceptId: params.data.conceptId,
      cleared: clearFamiliarity(db(), params.data.conceptId),
    }));
  });
}
