/**
 * Live smoke test for Circle balance + send USDC on Arc Testnet.
 * Uses the wallets SDK client (same path CIRCLE_CHECK_BALANCE / CIRCLE_SEND_USDC use).
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CircleAgentKit } from '@circle-plugins/core';

const here = fileURLToPath(new URL('.', import.meta.url));
loadEnv({ path: resolve(here, '../.env') });
loadEnv({ path: resolve(here, '../../.env.local') });
loadEnv({ path: resolve(here, '../../.env') });

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

async function main() {
  const apiKey = requireEnv('CIRCLE_API_KEY');
  const entitySecret =
    process.env.ENTITY_SECRET?.trim() || requireEnv('CIRCLE_ENTITY_SECRET');
  const walletId = requireEnv('CIRCLE_WALLET_ID');
  const destination =
    process.env.CIRCLE_TEST_DESTINATION?.trim() ||
    process.env.SERVER_ADDRESS?.trim() ||
    '';

  console.log('=== Circle plugin live test (Arc Testnet) ===');
  console.log(`walletId: ${walletId}`);
  console.log(`network: ${process.env.CIRCLE_NETWORK ?? 'TESTNET'}`);
  console.log(`chain: ${process.env.CIRCLE_DEFAULT_CHAIN ?? 'ARC-TESTNET'}`);

  const walletsMod = await import('@circle-fin/developer-controlled-wallets');
  const init =
    walletsMod.initiateDeveloperControlledWalletsClient ??
    (walletsMod as { default?: { initiateDeveloperControlledWalletsClient?: unknown } }).default
      ?.initiateDeveloperControlledWalletsClient;
  if (typeof init !== 'function') {
    throw new Error('initiateDeveloperControlledWalletsClient not found');
  }
  const walletsClient = (init as (cfg: { apiKey: string; entitySecret: string }) => unknown)({
    apiKey,
    entitySecret,
  });

  const kit = CircleAgentKit.create(
    {
      apiKey,
      entitySecret,
      network: (process.env.CIRCLE_NETWORK as 'TESTNET' | 'MAINNET') ?? 'TESTNET',
      defaultChain: process.env.CIRCLE_DEFAULT_CHAIN ?? 'ARC-TESTNET',
      walletSetId: process.env.CIRCLE_WALLET_SET_ID,
    },
    walletsClient as never,
  );

  console.log('\n[1/3] CIRCLE_CHECK_BALANCE...');
  const balances = await kit.getBalance(walletId);
  console.log(JSON.stringify(balances, null, 2));
  const usdc = balances.find((b) => (b.symbol ?? '').toUpperCase() === 'USDC');
  console.log(`USDC: ${usdc?.amount ?? '0'}`);

  const address = await kit.getAddress(walletId);
  console.log(`address: ${address}`);

  console.log('\n[2/3] Skipping faucet (wallet already funded).');

  if (!destination || !/^0x[a-fA-F0-9]{40}$/.test(destination)) {
    throw new Error('Set CIRCLE_TEST_DESTINATION or SERVER_ADDRESS to a 0x address.');
  }
  if (destination.toLowerCase() === address.toLowerCase()) {
    console.log('\n[3/3] Destination equals source wallet — skipping send.');
    console.log('Set CIRCLE_TEST_DESTINATION to another address to test send.');
    console.log('\n✅ Balance check passed.');
    return;
  }

  const sendAmount = process.env.CIRCLE_TEST_SEND_AMOUNT?.trim() || '0.01';
  console.log(`\n[3/3] CIRCLE_SEND_USDC ${sendAmount} -> ${destination}...`);
  const tx = await kit.sendUSDC({
    walletId,
    destinationAddress: destination,
    amount: sendAmount,
    chain: process.env.CIRCLE_DEFAULT_CHAIN ?? 'ARC-TESTNET',
    confirm: true,
    wait: true,
  });
  console.log(JSON.stringify(tx, null, 2));
  console.log(`Sent ${sendAmount} USDC. tx ${tx.id} state=${tx.state}`);

  const after = await kit.getBalance(walletId);
  console.log('\nFinal balances:', JSON.stringify(after, null, 2));
  console.log('\n✅ Circle balance + send USDC smoke test completed.');
}

main().catch((error) => {
  console.error('\n❌ Circle live test failed:');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
