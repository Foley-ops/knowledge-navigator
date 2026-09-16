import type { FastifyInstance } from 'fastify';
import { registerHealthRoutes } from './health.js';
import { registerConceptRoutes } from './concepts.js';
import { registerSearchRoutes } from './search.js';
import { registerGraphRoutes } from './graph.js';
import { registerAssistantRoutes } from './assistant.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await registerHealthRoutes(app);
  await registerConceptRoutes(app);
  await registerSearchRoutes(app);
  await registerGraphRoutes(app);
  await registerAssistantRoutes(app);
}
