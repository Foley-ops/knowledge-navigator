import type { FastifyInstance } from 'fastify';
import type { Config } from '../config.js';
import { createDisabledProvider } from './disabled.js';
import { createFixtureProvider } from './fixture.js';
import { createOllamaProvider } from './ollama.js';
import type { AssistantProvider, ProviderStatus } from './types.js';

export * from './types.js';
export { retrieve, MAX_RETRIEVED_CONCEPTS } from './retrieval.js';
export {
  buildUserPrompt,
  citableIds,
  extractJson,
  validateModelOutput,
  SYSTEM_PROMPT,
} from './prompt.js';
export { createDisabledProvider } from './disabled.js';
export { createFixtureProvider } from './fixture.js';
export { createOllamaProvider } from './ollama.js';

/**
 * Choose a provider from configuration. `fixture` is refused in production by
 * `assertProviderAllowed`, which runs before this.
 */
export function createProvider(config: Config, fetchImpl?: typeof fetch): AssistantProvider {
  switch (config.ASSISTANT_PROVIDER) {
    case 'disabled':
      return createDisabledProvider();
    case 'fixture':
      return createFixtureProvider();
    case 'ollama':
      return createOllamaProvider({
        baseUrl: config.OLLAMA_BASE_URL,
        model: config.OLLAMA_MODEL,
        ...(fetchImpl === undefined ? {} : { fetchImpl }),
      });
  }
}

/** Describe the active provider for the health and status endpoints. */
export async function describeProvider(
  app: FastifyInstance,
  options: { probe: boolean },
): Promise<ProviderStatus> {
  return app.assistant.status(options.probe);
}
