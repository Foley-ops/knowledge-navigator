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
 */
export interface LoggerOptions {
  level: string;
  redact: { paths: string[]; censor: string };
  formatters: { level: (label: string) => Record<string, unknown> };
}

export function loggerOptions(config: Config): LoggerOptions {
  return {
    level: config.NODE_ENV === 'test' ? 'silent' : config.LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.question',
        'req.body.context',
        'question',
        'context',
      ],
      censor: '[redacted]',
    },
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  };
}
