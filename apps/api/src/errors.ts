import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * One error shape for the whole API, so a client never has to guess.
 *
 * `requestId` lets a user quote a failure without pasting their research
 * context anywhere.
 */
export interface ApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly requestId: string;
}

export function errorBody(
  request: FastifyRequest,
  code: string,
  message: string,
  details?: unknown,
): ApiErrorBody {
  return details === undefined
    ? { error: { code, message }, requestId: request.id }
    : { error: { code, message, details }, requestId: request.id };
}

export function sendError(
  request: FastifyRequest,
  reply: FastifyReply,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): FastifyReply {
  return reply.code(status).send(errorBody(request, code, message, details));
}

/** 503 body used whenever the compiled index is not usable. */
export function indexUnavailable(request: FastifyRequest, reply: FastifyReply): FastifyReply {
  const { index } = request.server;
  return sendError(
    request,
    reply,
    503,
    'index_unavailable',
    index.message ??
      'The compiled index is unavailable. Canonical Markdown is unaffected; recompile to restore it.',
    { reason: index.reason ?? 'unknown' },
  );
}
