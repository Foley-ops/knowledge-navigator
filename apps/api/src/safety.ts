import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { errorBody } from './errors.js';

/**
 * Safety limits for a local single-user service (runbook E09).
 *
 * The threat model is not a hostile internet — the service binds to localhost
 * and publishes no API port. It is accident: a runaway script, a page left open
 * in a loop, a pasted file where a question belonged, another origin in the
 * browser reaching in. Each of those gets a bounded, honest refusal.
 */
export async function registerSafety(app: FastifyInstance): Promise<void> {
  const { config } = app;

  await app.register(helmet, {
    // This is a JSON API; a restrictive CSP costs nothing and blocks nothing
    // legitimate. The web container sets its own policy for the site itself.
    contentSecurityPolicy: {
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: false,
  });

  await app.register(cors, {
    origin: (origin, callback) => {
      // Same-origin and non-browser callers send no Origin header; the web
      // container proxies /api, so that is the normal path.
      if (origin === undefined || origin === '') {
        callback(null, true);
        return;
      }
      callback(null, config.ALLOWED_ORIGINS.includes(origin));
    },
    // PATCH is here for the personal update routes. DELETE deliberately is
    // not: nothing in this product hard-deletes a researcher's work.
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    credentials: false,
    maxAge: 600,
  });

  await app.register(rateLimit, {
    global: true,
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    // One process, one user: a single bucket is the honest model, and it avoids
    // keeping a table keyed by address for a service nobody else can reach.
    keyGenerator: () => 'local',
    errorResponseBuilder: (request, context) => ({
      ...errorBody(
        request,
        'rate_limited',
        `Too many requests. The limit is ${String(context.max)} per ${String(Math.round(config.RATE_LIMIT_WINDOW_MS / 1000))} seconds; try again in ${String(Math.ceil(Number(context.ttl) / 1000))} seconds.`,
      ),
      statusCode: 429,
    }),
  });

  /**
   * One error shape, and no stack traces in production. A local stack trace is
   * useful while developing and is noise — or a disclosure — anywhere else.
   */
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const status = error.statusCode ?? 500;

    if (status === 429) {
      return reply.code(429).send(error);
    }

    if (status >= 500) {
      request.log.error({ err: error, requestId: request.id }, 'request failed');
      const production = config.NODE_ENV === 'production';
      return reply
        .code(status)
        .send(
          errorBody(
            request,
            'internal_error',
            production
              ? 'The request failed. Check the service log for the request id below.'
              : (error.message ?? 'internal error'),
          ),
        );
    }

    const code =
      status === 413
        ? 'payload_too_large'
        : status === 400
          ? 'bad_request'
          : status === 415
            ? 'unsupported_media_type'
            : 'request_rejected';
    const message =
      status === 413
        ? `The request body is larger than the ${String(config.BODY_LIMIT_BYTES)} byte limit.`
        : error.message;
    return reply.code(status).send(errorBody(request, code, message));
  });

  app.setNotFoundHandler((request, reply) =>
    reply
      .code(404)
      .send(
        errorBody(
          request,
          'route_not_found',
          `No API route matches ${request.method} ${request.url}.`,
        ),
      ),
  );
}
