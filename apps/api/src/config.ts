import { z } from 'zod';

/**
 * Environment contract for the API (runbook §4.4).
 *
 * Every value has a safe local default so that the service starts in a private,
 * localhost-only configuration without a `.env` file. Nothing here is a secret;
 * the configuration is deliberately free of credentials.
 */
export const assistantProviders = ['disabled', 'fixture', 'ollama'] as const;
export type AssistantProviderName = (typeof assistantProviders)[number];

const trimmed = z.string().trim();

const portSchema = z.coerce.number().int().min(1).max(65535);

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ASSISTANT_PROVIDER: z.enum(assistantProviders).default('ollama'),
  OLLAMA_BASE_URL: trimmed.url().default('http://host.docker.internal:11434'),
  OLLAMA_MODEL: trimmed.min(1).default('qwen3.8:27b-mlx'),
  ASSISTANT_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(600_000).default(120_000),
  DATABASE_PATH: trimmed.min(1).default('/data/knowledge.db'),
  CONTENT_PATH: trimmed.min(1).default('/app/content/concepts'),
  PORT: portSchema.default(8000),
  HOST: trimmed.min(1).default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type Config = Readonly<z.infer<typeof configSchema>>;

export class ConfigError extends Error {
  public readonly issues: readonly string[];
  constructor(issues: readonly string[]) {
    super(`Invalid API configuration:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
    this.name = 'ConfigError';
    this.issues = issues;
  }
}

/** Parse configuration from an environment-like record. Unknown keys are ignored. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const present: Record<string, string> = {};
  for (const key of Object.keys(configSchema.shape)) {
    const value = env[key];
    if (value !== undefined && value !== '') present[key] = value;
  }
  const result = configSchema.safeParse(present);
  if (!result.success) {
    throw new ConfigError(
      result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    );
  }
  return Object.freeze(result.data);
}

/**
 * The fixture provider is a deterministic test double. Allowing it in a
 * production process would let the service answer research questions with
 * canned text, so it is refused outright (runbook §4.4).
 */
export function assertProviderAllowed(config: Config): void {
  if (config.NODE_ENV === 'production' && config.ASSISTANT_PROVIDER === 'fixture') {
    throw new ConfigError([
      'ASSISTANT_PROVIDER: the "fixture" provider is a deterministic test double and is forbidden when NODE_ENV=production',
    ]);
  }
}
