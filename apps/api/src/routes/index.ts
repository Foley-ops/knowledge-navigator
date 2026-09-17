import type { FastifyInstance } from 'fastify';
import { registerHealthRoutes } from './health.js';
import { registerConceptRoutes } from './concepts.js';
import { registerSearchRoutes } from './search.js';
import { registerGraphRoutes } from './graph.js';
import { registerCoverageRoutes } from './coverage.js';
import { registerPersonalRoutes } from './personal.js';
import { registerArtifactRoutes } from './artifacts.js';
import { registerCompareRoutes } from './compare.js';
import { registerPathRoutes } from './paths.js';
import { registerAssistantRoutes } from './assistant.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await registerHealthRoutes(app);
  await registerConceptRoutes(app);
  await registerSearchRoutes(app);
  await registerGraphRoutes(app);
  await registerCoverageRoutes(app);
  await registerPersonalRoutes(app);
  await registerArtifactRoutes(app);
  await registerCompareRoutes(app);
  await registerPathRoutes(app);
  await registerAssistantRoutes(app);
}
