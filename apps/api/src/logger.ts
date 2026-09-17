import type { Config } from './config.js';

/**
 * Structured (JSON) logging options.
 *
 * A single concrete options shape is always returned — tests silence the logger
 * with `level: 'silent'` rather than disabling it — so Fastify's option
 * overloads resolve unambiguously.
 *
 * Research questions and user-supplied research context are private. They are
 * redacted here so that no ordinary log line can contain them (runbook E08).
 *
 * Version 2 adds a whole private store, so the list grew with it: a project
 * title, a note body, an artifact name, a session's starting question, a saved
 * answer. A log line about a personal request carries a route, a status, a
 * latency and a count — never a word the researcher wrote (v2 runbook N08).
 *
 * Fastify's default request serializer never logs a body at all; this list is
 * the second line of defence, for anything that ends up in a log object by
 * another route.
 */
export interface LoggerOptions {
  level: string;
  redact: { paths: string[]; censor: string };
  formatters: { level: (label: string) => Record<string, unknown> };
}

/**
 * Field names that may hold something a person wrote.
 *
 * Each is redacted both at the top level of a log object and under `req.body`,
 * which is where a body would appear if anything ever logged one.
 */
export const PRIVATE_FIELDS = [
  // v1: the assistant
  'question',
  'context',
  // v2: the private research store
  'title',
  'description',
  'body',
  'label',
  'note',
  'statement',
  'rationale',
  'startingQuestion',
  'contextSummary',
  'payload',
  'answer',
  'interpretation',
  'extractedText',
  'originalName',
  'filename',
] as const;

export function loggerOptions(config: Config): LoggerOptions {
  return {
    level: config.NODE_ENV === 'test' ? 'silent' : config.LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        ...PRIVATE_FIELDS.map((field) => `req.body.${field}`),
        ...PRIVATE_FIELDS.map((field) => `res.body.${field}`),
        ...PRIVATE_FIELDS,
      ],
      censor: '[redacted]',
    },
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  };
}
