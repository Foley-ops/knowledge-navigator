import type { AssistantProvider, ProviderOutcome, ProviderStatus } from './types.js';

/**
 * The `disabled` provider (runbook §4.4).
 *
 * Generation is intentionally off. Browsing, search and the graph keep working;
 * the assistant says plainly that it is unavailable and why, rather than
 * pretending to be thinking or inventing an answer.
 */
export function createDisabledProvider(): AssistantProvider {
  const detail =
    'Generation is switched off (ASSISTANT_PROVIDER=disabled). Browsing, search and the concept graph are unaffected. Set ASSISTANT_PROVIDER=ollama and point OLLAMA_BASE_URL at a running Ollama to enable it.';
  return {
    name: 'disabled',
    status: (): Promise<ProviderStatus> =>
      Promise.resolve({ provider: 'disabled', available: false, model: null, detail }),
    generate: (): Promise<ProviderOutcome> =>
      Promise.resolve({
        ok: false,
        code: 'provider_disabled',
        message: detail,
        model: null,
        latencyMs: 0,
      }),
  };
}
