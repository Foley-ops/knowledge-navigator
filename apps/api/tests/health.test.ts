import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const testConfig = loadConfig({ NODE_ENV: 'test', ASSISTANT_PROVIDER: 'disabled' });

describe('GET /api/health', () => {
  it('answers 200 with an ok status from an in-memory instance', async () => {
    const app = await buildApp({ config: testConfig });
    try {
      const response = await app.inject({ method: 'GET', url: '/api/health' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'ok' });
    } finally {
      await app.close();
    }
  });
});
