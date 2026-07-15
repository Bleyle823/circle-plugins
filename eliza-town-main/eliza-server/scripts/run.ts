import dotenv from 'dotenv';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');

dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, 'eliza-server', '.env'), override: true });

// ElizaOS bootstrap rejects 2048-dim embeddings (Convex NPCs use 2048 separately).
process.env.OPENROUTER_EMBEDDING_DIMENSIONS = '1536';
process.env.EMBEDDING_DIMENSION = '1536';
process.env.OPENROUTER_EMBEDDING_MODEL =
  process.env.ELIZA_EMBEDDING_MODEL || 'openai/text-embedding-3-small';

const { AgentServer } = await import('@elizaos/server');
const { default: project } = await import('../src/index.js');

const port = Number(process.env.PORT ?? 3000);
const dataDir =
  process.env.PGLITE_DATA_DIR ??
  path.join(__dirname, '..', 'data', 'pglite');

// Agents spawn on-demand via POST /api/agents — skip heavy boot-time agent unless opted in.
const startDefaultAgent = process.env.ELIZA_START_DEFAULT_AGENT === 'true';
const agents = startDefaultAgent
  ? (project.agents ?? []).map((agent) => ({
      character: {
        ...agent.character,
        plugins: agent.character.plugins ?? [],
      },
      plugins: agent.plugins ?? [],
      init: agent.init,
    }))
  : [];

async function startServer(resetDatabase = false) {
  if (resetDatabase && existsSync(dataDir)) {
    console.warn(`[eliza-town] Resetting database at ${dataDir}`);
    rmSync(dataDir, { recursive: true, force: true });
  }

  const server = new AgentServer();
  await server.start({
    port,
    dataDir,
    postgresUrl: process.env.POSTGRES_URL,
    agents,
  });

  if (startDefaultAgent) {
    console.log(`[eliza-town] Server listening on http://localhost:${port} (default agent started)`);
  } else {
    console.log(
      `[eliza-town] Server listening on http://localhost:${port} (agents spawn on demand via /api/agents)`,
    );
  }
}

try {
  await startServer(false);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Database migration failed') && existsSync(dataDir)) {
    console.warn('[eliza-town] Migration failed — retrying with a fresh database...');
    await startServer(true);
  } else {
    throw error;
  }
}
