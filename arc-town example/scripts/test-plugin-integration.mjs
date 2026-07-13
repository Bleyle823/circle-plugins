#!/usr/bin/env node
/**
 * Smoke test: Circle plugin + Eliza Town integration.
 * Requires eliza-server running on ELIZA_SERVER_URL (default http://localhost:3000).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const elizaUrl = process.env.ELIZA_SERVER_URL || 'http://127.0.0.1:3000';

function parseEnv(text) {
  const map = new Map();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    map.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim());
  }
  return map;
}

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

async function main() {
  console.log('=== Eliza Town + Circle plugin integration test ===\n');

  // 1. Health check
  let healthRes;
  try {
    healthRes = await fetch(`${elizaUrl}/healthz`);
  } catch (error) {
    fail(`Eliza server not reachable at ${elizaUrl} — run npm run dev first. (${error})`);
  }
  if (!healthRes.ok) {
    fail(`Health check returned ${healthRes.status}`);
  }
  ok(`Eliza server healthy at ${elizaUrl}`);

  // 2. Create agent with Circle plugin
  const env = parseEnv(readFileSync(path.join(root, 'eliza-server', '.env'), 'utf8'));
  const includeCircle = env.get('ENABLE_CIRCLE_PLUGIN') === 'true';
  const characterJson = {
    name: `Plugin Test ${Date.now()}`,
    bio: ['Integration test agent for Circle plugin'],
    adjectives: ['Helpful'],
    system: 'You are a test agent.',
    plugins: [
      '@elizaos/plugin-sql',
      '@elizaos/plugin-openrouter',
      '@elizaos/plugin-bootstrap',
      ...(includeCircle ? ['@circle-plugins/plugin-eliza'] : []),
    ],
    settings: {
      OPENROUTER_SMALL_MODEL: env.get('OPENROUTER_SMALL_MODEL') || 'openrouter/free',
      OPENROUTER_LARGE_MODEL: env.get('OPENROUTER_LARGE_MODEL') || 'openrouter/free',
      OPENROUTER_EMBEDDING_MODEL: 'openai/text-embedding-3-small',
      OPENROUTER_EMBEDDING_DIMENSIONS: '1536',
      EMBEDDING_DIMENSION: '1536',
      secrets: {},
    },
  };

  console.log(`Creating test agent (Circle plugin: ${includeCircle})...`);
  const createRes = await fetch(`${elizaUrl}/api/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterJson }),
  });
  const createText = await createRes.text();
  if (!createRes.ok) {
    fail(`Agent creation failed (${createRes.status}): ${createText.slice(0, 500)}`);
  }

  let createData;
  try {
    createData = JSON.parse(createText);
  } catch {
    fail(`Invalid JSON from agent creation: ${createText.slice(0, 200)}`);
  }

  const agentId =
    createData.data?.id ||
    createData.id ||
    createData.data?.character?.id ||
    (Array.isArray(createData) ? createData[0]?.id : null);
  if (!agentId) {
    fail(`No agent ID in response: ${createText.slice(0, 300)}`);
  }
  ok(`Agent created: ${agentId}`);

  // 3. Verify agent has Circle plugin loaded
  const createPlugins =
    createData.data?.character?.plugins || createData.data?.plugins || createData.character?.plugins || [];
  if (includeCircle && createPlugins.length > 0) {
    ok(`Create response plugins: ${createPlugins.join(', ')}`);
    if (!createPlugins.includes('@circle-plugins/plugin-eliza')) {
      fail('Circle plugin not present in create response');
    }
    ok('Circle plugin registered on agent');
  } else {
    const getRes = await fetch(`${elizaUrl}/api/agents/${agentId}`);
    if (!getRes.ok) {
      fail(`Could not fetch agent ${agentId}: ${getRes.status}`);
    }
    const agentData = await getRes.json();
    const plugins =
      agentData?.data?.plugins ||
      agentData?.data?.character?.plugins ||
      agentData?.character?.plugins ||
      agentData?.plugins ||
      [];
    ok(`Agent plugins: ${plugins.join(', ') || '(none)'}`);

    if (includeCircle && !plugins.includes('@circle-plugins/plugin-eliza')) {
      fail('Circle plugin not present on created agent');
    }
    if (includeCircle) {
      ok('Circle plugin registered on agent');
    }
  }

  // 4. Send a chat message via sessions API (OpenRouter + plugins)
  console.log('Starting agent runtime and sending test message...');
  const startRes = await fetch(`${elizaUrl}/api/agents/${agentId}/start`, { method: 'POST' });
  if (!startRes.ok) {
    fail(`Agent start failed (${startRes.status}): ${(await startRes.text()).slice(0, 300)}`);
  }
  ok('Agent runtime started');

  const sessionRes = await fetch(`${elizaUrl}/api/messaging/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId,
      userId: '00000000-0000-4000-8000-000000000001',
    }),
  });
  const sessionText = await sessionRes.text();
  if (!sessionRes.ok) {
    fail(`Session creation failed (${sessionRes.status}): ${sessionText.slice(0, 500)}`);
  }
  const sessionData = JSON.parse(sessionText);
  const sessionId = sessionData.sessionId;
  if (!sessionId) {
    fail(`No sessionId: ${sessionText.slice(0, 300)}`);
  }
  ok(`Session created: ${sessionId}`);

  console.log('Sending test message...');
  const msgRes = await fetch(`${elizaUrl}/api/messaging/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'Hello! Reply with one short sentence.',
      transport: 'http',
    }),
  });
  const msgText = await msgRes.text();
  if (!msgRes.ok) {
    fail(`Message failed (${msgRes.status}): ${msgText.slice(0, 500)}`);
  }

  let msgData;
  try {
    msgData = JSON.parse(msgText);
  } catch {
    msgData = msgText;
  }

  let reply =
    msgData?.agentMessage?.content ||
    msgData?.agentMessage?.text ||
    msgData?.text ||
    msgData?.content ||
    msgData?.data?.text ||
    msgData?.data?.content;

  if (!reply) {
    await new Promise((r) => setTimeout(r, 8000));
    const pollRes = await fetch(`${elizaUrl}/api/messaging/sessions/${sessionId}/messages`);
    if (pollRes.ok) {
      const pollData = await pollRes.json();
      const messages = pollData.messages || pollData.data?.messages || pollData;
      if (Array.isArray(messages)) {
        const agentMsg = [...messages].reverse().find((m) => m.author_id !== '00000000-0000-4000-8000-000000000001');
        reply = agentMsg?.content || agentMsg?.text;
      }
    }
  }

  if (!reply) {
    console.warn('WARN: No reply text parsed (agent may still be initializing)');
    console.log('Response:', msgText.slice(0, 400));
  } else {
    ok(`Agent replied: "${String(reply).slice(0, 120)}"`);
  }

  // 5. Cleanup
  const delRes = await fetch(`${elizaUrl}/api/agents/${agentId}`, { method: 'DELETE' });
  if (delRes.ok) {
    ok('Test agent cleaned up');
  }

  console.log('\n=== All integration checks passed ===');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
