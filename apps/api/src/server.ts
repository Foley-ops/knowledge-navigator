import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { openIndex } from './index-handle.js';

/**
 * Process entry point.
 *
 * Startup fails loudly when the compiled index is unusable (runbook E00): a
 * process that cannot answer questions about the corpus should not pretend to
 * be up. Canonical Markdown is untouched either way — recompiling fixes it.
 */
async function main(): Promise<void> {
  const config = loadConfig();

  const index = openIndex(config.DATABASE_PATH);
  if (!index.available) {
    console.error(
      `Knowledge Navigator API cannot start.\n\n  ${index.message ?? 'unknown error'}\n`,
    );
    process.exit(1);
  }

  const app = await buildApp({ config, index });

  let closing = false;
  const close = async (signal: string): Promise<void> => {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      index.close();
      process.exit(0);
    } catch (error) {
      app.log.error({ err: error }, 'shutdown failed');
      process.exit(1);
    }
  };

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => void close(signal));
  }

  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(
    {
      port: config.PORT,
      host: config.HOST,
      provider: config.ASSISTANT_PROVIDER,
      schemaVersion: index.schemaVersion,
    },
    'knowledge navigator api listening',
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
