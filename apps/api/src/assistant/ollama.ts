/**
 * The `ollama` provider (runbook E07).
 *
 * Talks to a local Ollama over plain HTTP. Every failure mode a local model
 * actually has — server down, model not pulled, request too slow, reply that is
 * not JSON, reply that is JSON but wrong, reply that cites a paper that was
 * never supplied — is mapped to a specific, safe error rather than being
 * allowed to surface as an exception or, worse, as a plausible answer.
 */
import { SYSTEM_PROMPT, buildUserPrompt, resultJsonSchema, validateModelOutput } from './prompt.js';
import type { AssistantProvider, GenerateInput, ProviderOutcome, ProviderStatus } from './types.js';

export interface OllamaOptions {
  readonly baseUrl: string;
  readonly model: string;
  /** Injectable for tests; defaults to the global fetch. */
  readonly fetchImpl?: typeof fetch;
}

interface ChatResponse {
  readonly message?: { readonly content?: unknown };
  readonly error?: unknown;
}

function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

/** Combine the caller's cancellation with our own timeout. */
function withTimeout(timeoutMs: number, signal: AbortSignal | undefined): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal === undefined ? timeout : AbortSignal.any([timeout, signal]);
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

export function createOllamaProvider(options: OllamaOptions): AssistantProvider {
  const doFetch = options.fetchImpl ?? globalThis.fetch;
  const { baseUrl, model } = options;

  async function listModels(timeoutMs: number): Promise<string[]> {
    const response = await doFetch(endpoint(baseUrl, '/api/tags'), {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`Ollama replied ${String(response.status)} to /api/tags`);
    }
    const body = (await response.json()) as { models?: { name?: unknown; model?: unknown }[] };
    return (body.models ?? [])
      .map((entry) => (typeof entry.name === 'string' ? entry.name : String(entry.model ?? '')))
      .filter((name) => name !== '');
  }

  return {
    name: 'ollama',

    async status(probe: boolean): Promise<ProviderStatus> {
      if (!probe) {
        return {
          provider: 'ollama',
          available: true,
          model,
          detail: `Configured to use the local model ${model}. Reachability is checked on demand.`,
        };
      }
      try {
        const names = await listModels(5_000);
        if (names.includes(model)) {
          return {
            provider: 'ollama',
            available: true,
            model,
            detail: `The local Ollama is reachable and ${model} is installed.`,
          };
        }
        return {
          provider: 'ollama',
          available: false,
          model,
          detail:
            names.length === 0
              ? `The local Ollama is reachable but has no models installed. Pull ${model} first.`
              : `The local Ollama is reachable but ${model} is not installed. Installed: ${names.slice(0, 8).join(', ')}.`,
        };
      } catch (error) {
        return {
          provider: 'ollama',
          available: false,
          model,
          detail: isAbort(error)
            ? 'The local Ollama did not respond in time.'
            : 'The local Ollama could not be reached. Is it running?',
        };
      }
    },

    async generate({
      request,
      retrieval,
      privateContext,
      timeoutMs,
      signal,
    }: GenerateInput): Promise<ProviderOutcome> {
      const startedAt = performance.now();
      const elapsed = (): number => Math.round(performance.now() - startedAt);

      let response: Response;
      try {
        response = await doFetch(endpoint(baseUrl, '/api/chat'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          signal: withTimeout(timeoutMs, signal),
          body: JSON.stringify({
            model,
            stream: false,
            // Deterministic settings: the same question should not wander.
            options: { temperature: 0, seed: 7 },
            format: resultJsonSchema(),
            think: false,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: buildUserPrompt(request, retrieval, privateContext) },
            ],
          }),
        });
      } catch (error) {
        if (isAbort(error)) {
          return {
            ok: false,
            code: 'timeout',
            message: `The local model did not answer within ${String(Math.round(timeoutMs / 1000))} seconds.`,
            model,
            latencyMs: elapsed(),
          };
        }
        return {
          ok: false,
          code: 'provider_unreachable',
          message: 'The local model provider could not be reached. Is Ollama running?',
          model,
          latencyMs: elapsed(),
          detail: error instanceof Error ? error.message : String(error),
        };
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const notFound = response.status === 404 || /not found|no such model|pull/i.test(text);
        return {
          ok: false,
          code: notFound ? 'model_unavailable' : 'provider_error',
          message: notFound
            ? `The model ${model} is not available on the configured Ollama.`
            : `The local model provider returned HTTP ${String(response.status)}.`,
          model,
          latencyMs: elapsed(),
          detail: text.slice(0, 500),
        };
      }

      let body: ChatResponse;
      try {
        body = (await response.json()) as ChatResponse;
      } catch (error) {
        return {
          ok: false,
          code: 'provider_error',
          message: 'The local model provider returned a response that was not JSON.',
          model,
          latencyMs: elapsed(),
          detail: error instanceof Error ? error.message : String(error),
        };
      }

      if (body.error !== undefined) {
        const detail = typeof body.error === 'string' ? body.error : JSON.stringify(body.error);
        return {
          ok: false,
          code: /not found|pull/i.test(detail) ? 'model_unavailable' : 'provider_error',
          message: `The local model provider reported an error.`,
          model,
          latencyMs: elapsed(),
          detail: detail.slice(0, 500),
        };
      }

      const content = body.message?.content;
      if (typeof content !== 'string' || content.trim() === '') {
        return {
          ok: false,
          code: 'invalid_model_output',
          message: 'The local model returned an empty reply.',
          model,
          latencyMs: elapsed(),
        };
      }

      const validated = validateModelOutput(content, retrieval);
      if (!validated.ok) {
        const { failure } = validated;
        return {
          ok: false,
          code:
            failure.kind === 'fabricated-citation' ? 'fabricated_citation' : 'invalid_model_output',
          message:
            failure.kind === 'fabricated-citation'
              ? 'The model cited material that was not supplied to it, so its answer was discarded.'
              : 'The model did not return a valid structured answer, so it was discarded.',
          model,
          latencyMs: elapsed(),
          detail: failure.detail,
        };
      }

      return { ok: true, result: validated.result, model, latencyMs: elapsed() };
    },
  };
}
