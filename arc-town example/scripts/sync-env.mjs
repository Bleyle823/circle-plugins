#!/usr/bin/env node
/**
 * Merges eliza-server/.env into root .env and .env.local, then pushes keys to Convex.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const keysToSync = [
  'LLM_PROVIDER',
  'OPENROUTER_API_KEY',
  'OPENROUTER_SMALL_MODEL',
  'OPENROUTER_LARGE_MODEL',
  'OPENROUTER_EMBEDDING_MODEL',
  'OPENROUTER_EMBEDDING_DIMENSIONS',
  'ELIZA_SERVER_URL',
  'AUTO_START_X402_SERVER',
  'ENABLE_CIRCLE_PLUGIN',
  'CIRCLE_API_KEY',
  'ENTITY_SECRET',
  'CIRCLE_ENTITY_SECRET',
  'CIRCLE_DEFAULT_CHAIN',
  'CIRCLE_NETWORK',
  'CIRCLE_WALLET_ID',
  'SERVER_ADDRESS',
];

const convexKeys = [
  'LLM_PROVIDER',
  'OPENROUTER_API_KEY',
  'OPENROUTER_SMALL_MODEL',
  'OPENROUTER_LARGE_MODEL',
  'OPENROUTER_EMBEDDING_MODEL',
  'OPENROUTER_EMBEDDING_DIMENSIONS',
  'ELIZA_SERVER_URL',
  'AUTO_START_X402_SERVER',
  'ENABLE_CIRCLE_PLUGIN',
  'CIRCLE_API_KEY',
  'ENTITY_SECRET',
  'CIRCLE_ENTITY_SECRET',
  'CIRCLE_DEFAULT_CHAIN',
  'CIRCLE_NETWORK',
  'CIRCLE_WALLET_ID',
  'SERVER_ADDRESS',
];

function parseEnv(text) {
  const map = new Map();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    map.set(key, value);
  }
  return map;
}

function mergeEnvFile(filePath, source) {
  let lines = [];
  const existing = new Map();
  if (existsSync(filePath)) {
    const text = readFileSync(filePath, 'utf8');
    lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      existing.set(trimmed.slice(0, eq).trim(), true);
    }
  }

  const additions = [];
  for (const key of keysToSync) {
    const value = source.get(key);
    if (!value) continue;
    if (existing.has(key)) {
      lines = lines.map((line) => {
        if (line.trim().startsWith(`${key}=`)) {
          return `${key}=${value}`;
        }
        return line;
      });
    } else {
      additions.push(`${key}=${value}`);
    }
  }

  if (!source.get('LLM_PROVIDER') && source.get('OPENROUTER_API_KEY')) {
    const key = 'LLM_PROVIDER';
    if (!existing.has(key) && !additions.some((l) => l.startsWith(`${key}=`))) {
      additions.push(`${key}=openrouter`);
    }
  }

  const output = [...lines.filter((l, i, arr) => !(i === arr.length - 1 && l === '')), ...additions].join('\n');
  writeFileSync(filePath, output.endsWith('\n') ? output : output + '\n');
  console.log(`Updated ${path.relative(root, filePath)}`);
}

function pushConvexEnv(source) {
  for (const key of convexKeys) {
    const value = source.get(key);
    if (!value) continue;
    try {
      const output = execSync(`npx convex env set ${key} "${value.replace(/"/g, '\\"')}"`, {
        cwd: root,
        encoding: 'utf8',
        env: process.env,
      });
      if (output.includes('Successfully set')) {
        console.log(`Convex env: ${key}`);
      }
    } catch (error) {
      const out = (error.stdout || error.stderr || error.message || '').toString();
      if (out.includes('Successfully set')) {
        console.log(`Convex env: ${key}`);
      } else {
        console.warn(`Could not set Convex env ${key}:`, out);
      }
    }
  }
}

const elizaEnvPath = path.join(root, 'eliza-server', '.env');
if (!existsSync(elizaEnvPath)) {
  console.log('No eliza-server/.env found — copy .env.example and add OPENROUTER_API_KEY.');
  process.exit(0);
}

const source = parseEnv(readFileSync(elizaEnvPath, 'utf8'));
if (!source.get('OPENROUTER_API_KEY')) {
  console.warn('Warning: OPENROUTER_API_KEY is empty in eliza-server/.env');
}
if (!source.get('LLM_PROVIDER') && source.get('OPENROUTER_API_KEY')) {
  source.set('LLM_PROVIDER', 'openrouter');
}

const rootEnv = path.join(root, '.env');
if (!existsSync(rootEnv)) {
  writeFileSync(rootEnv, readFileSync(path.join(root, '.env.example'), 'utf8'));
}
mergeEnvFile(rootEnv, source);
mergeEnvFile(path.join(root, '.env.local'), source);
pushConvexEnv(source);

console.log('Environment synced. Run: npm run dev');
