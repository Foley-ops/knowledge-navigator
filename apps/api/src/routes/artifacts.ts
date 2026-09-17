import { z } from 'zod';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { sendError } from '../errors.js';
import {
  ALLOWED_EXTENSIONS,
  ExtractionError,
  MAX_UPLOAD_BYTES,
  extensionOf,
  extractArtifact,
  isAllowedExtension,
} from '../artifacts/index.js';
import {
  PersonalNotFoundError,
  PersonalValidationError,
  archiveArtifact,
  createArtifact,
  getArtifactInProject,
  getProject,
  listArtifacts,
  restoreArtifact,
} from '../personal/index.js';
import { PersonalUnavailableError } from '../personal/handle.js';

/**
 * Uploading local research context (v2 runbook P05).
 *
 * The request is bounded before a byte is read: one file, 10 MiB, one field.
 * The file name decides how it is read — never the browser's Content-Type,
 * which is trivially wrong and trivially forged — and an extension this product
 * does not read is refused before extraction starts.
 *
 * Nothing about the file is logged. Not its name, not its size, not a word of
 * its contents: a log line about an upload says which project and how many
 * characters came out, because a research paper's title can itself be the
 * private fact.
 */

const projectIdParam = z.object({ projectId: z.string().uuid() });
const artifactParams = z.object({
  projectId: z.string().uuid(),
  artifactId: z.string().uuid(),
});

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

function mapPersonalError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
): FastifyReply {
  if (error instanceof PersonalValidationError) {
    return sendError(request, reply, 400, 'invalid_request', 'The request is not valid.', {
      issues: error.issues,
    });
  }
  if (error instanceof PersonalNotFoundError) {
    return sendError(request, reply, 404, 'not_found', `No ${error.what} with id ${error.id}.`);
  }
  if (error instanceof PersonalUnavailableError) return personalUnavailable(request, reply);
  throw error;
}

export async function registerArtifactRoutes(app: FastifyInstance): Promise<void> {
  const multipart = await import('@fastify/multipart');
  await app.register(multipart.default, {
    limits: {
      fileSize: MAX_UPLOAD_BYTES,
      files: 1,
      // A label and nothing else. More fields would be a sign of a request
      // this endpoint was not built for.
      fields: 4,
      fieldSize: 1_000,
    },
  });

  app.post('/api/personal/projects/:projectId/artifacts', async (request, reply) => {
    if (!app.personal.available) return personalUnavailable(request, reply);
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) {
      return sendError(request, reply, 400, 'invalid_request', 'The project id is not valid.');
    }

    try {
      getProject(app.personal.db, params.data.projectId);
    } catch (error) {
      return mapPersonalError(request, reply, error);
    }

    if (!request.isMultipart()) {
      return sendError(
        request,
        reply,
        415,
        'unsupported_media_type',
        'Upload a file as multipart/form-data.',
      );
    }

    let part: Awaited<ReturnType<typeof request.file>>;
    try {
      part = await request.file();
    } catch (error) {
      // @fastify/multipart raises this once the stream passes the byte limit.
      if ((error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
        return sendError(
          request,
          reply,
          413,
          'file_too_large',
          `The file is larger than the ${String(MAX_UPLOAD_BYTES)} byte limit.`,
        );
      }
      return sendError(request, reply, 400, 'invalid_upload', 'The upload could not be read.');
    }

    if (part === undefined) {
      return sendError(request, reply, 400, 'invalid_upload', 'No file was included.');
    }

    const originalName = part.filename;
    const extension = extensionOf(originalName);
    if (!isAllowedExtension(extension)) {
      // Drain the stream so the connection closes cleanly rather than resetting.
      part.file.resume();
      return sendError(
        request,
        reply,
        415,
        'unsupported_type',
        `Files ending in "${extension === '' ? '(no extension)' : extension}" are not read.`,
        { allowed: [...ALLOWED_EXTENSIONS] },
      );
    }

    let bytes: Buffer;
    try {
      bytes = await part.toBuffer();
    } catch (error) {
      if ((error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
        return sendError(
          request,
          reply,
          413,
          'file_too_large',
          `The file is larger than the ${String(MAX_UPLOAD_BYTES)} byte limit.`,
        );
      }
      return sendError(request, reply, 400, 'invalid_upload', 'The upload could not be read.');
    }
    if (part.file.truncated) {
      return sendError(
        request,
        reply,
        413,
        'file_too_large',
        `The file is larger than the ${String(MAX_UPLOAD_BYTES)} byte limit.`,
      );
    }

    // A declared media type that disagrees with the extension is a reason to
    // stop: one of the two is wrong, and guessing which would mean reading the
    // file in a way its author did not intend.
    const declared = part.mimetype;
    if (extension === '.pdf' && declared !== '' && !declared.includes('pdf')) {
      return sendError(
        request,
        reply,
        415,
        'type_mismatch',
        'The file is named .pdf but was sent with a different media type. Nothing was read.',
      );
    }

    let extraction;
    try {
      extraction = await extractArtifact(originalName, new Uint8Array(bytes));
    } catch (error) {
      if (error instanceof ExtractionError) {
        return sendError(request, reply, 422, error.code, error.message);
      }
      throw error;
    }

    const labelField = (part.fields as Record<string, unknown> | undefined)?.['label'];
    const label =
      typeof labelField === 'object' &&
      labelField !== null &&
      'value' in labelField &&
      typeof (labelField as { value: unknown }).value === 'string' &&
      (labelField as { value: string }).value.trim() !== ''
        ? (labelField as { value: string }).value.trim().slice(0, 300)
        : originalName.slice(0, 300);

    try {
      const result = createArtifact(app.personal.db, params.data.projectId, {
        label,
        originalName,
        mediaType: extraction.mediaType,
        byteCount: extraction.byteCount,
        characterCount: extraction.characterCount,
        sha256: extraction.sha256,
        warnings: [...extraction.warnings],
        extractedText: extraction.text,
      });
      // Counts only. The file name is itself private.
      request.log.info(
        {
          projectId: params.data.projectId,
          characterCount: extraction.characterCount,
          byteCount: extraction.byteCount,
          deduplicated: result.deduplicated,
        },
        'artifact stored',
      );
      return reply.send(result);
    } catch (error) {
      return mapPersonalError(request, reply, error);
    }
  });

  app.get('/api/personal/projects/:projectId/artifacts', async (request, reply) => {
    if (!app.personal.available) return personalUnavailable(request, reply);
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) {
      return sendError(request, reply, 400, 'invalid_request', 'The project id is not valid.');
    }
    const query = z
      .strictObject({ includeArchived: z.enum(['', 'true', '1', 'false', '0']).optional() })
      .safeParse(request.query);
    if (!query.success) {
      return sendError(request, reply, 400, 'invalid_query', 'The query parameters are not valid.');
    }
    try {
      const value = query.data.includeArchived;
      return reply.send({
        items: listArtifacts(app.personal.db, params.data.projectId, {
          includeArchived: value === '' || value === 'true' || value === '1',
        }),
      });
    } catch (error) {
      return mapPersonalError(request, reply, error);
    }
  });

  app.get('/api/personal/projects/:projectId/artifacts/:artifactId', async (request, reply) => {
    if (!app.personal.available) return personalUnavailable(request, reply);
    const params = artifactParams.safeParse(request.params);
    if (!params.success) {
      return sendError(request, reply, 400, 'invalid_request', 'The ids are not valid.');
    }
    try {
      const artifact = getArtifactInProject(
        app.personal.db,
        params.data.projectId,
        params.data.artifactId,
      );
      return reply.send(artifact);
    } catch (error) {
      return mapPersonalError(request, reply, error);
    }
  });

  for (const [action, run] of [
    ['archive', archiveArtifact],
    ['restore', restoreArtifact],
  ] as const) {
    app.post(
      `/api/personal/projects/:projectId/artifacts/:artifactId/${action}`,
      async (request, reply) => {
        if (!app.personal.available) return personalUnavailable(request, reply);
        const params = artifactParams.safeParse(request.params);
        if (!params.success) {
          return sendError(request, reply, 400, 'invalid_request', 'The ids are not valid.');
        }
        try {
          return reply.send(run(app.personal.db, params.data.projectId, params.data.artifactId));
        } catch (error) {
          return mapPersonalError(request, reply, error);
        }
      },
    );
  }
}
