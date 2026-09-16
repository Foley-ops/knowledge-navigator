import { buildApp } from './app.js';
import { loadConfig } from './config.js';

/** Process entry point. Starts the API and shuts it down cleanly on signals. */
async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp({ config });

  const close = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
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
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
