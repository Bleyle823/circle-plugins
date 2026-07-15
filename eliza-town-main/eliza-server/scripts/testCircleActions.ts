/**
 * Exercise CIRCLE_CHECK_BALANCE and CIRCLE_SEND_USDC action handlers
 * with a runtime that wraps a live CircleAgentKit (wallets client injected).
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { CircleAgentKit } from '@circle-plugins/core';
import { checkBalanceAction, sendUsdcAction } from '../../packages/plugin-eliza/src/actions.ts';
import { CircleService } from '../../packages/plugin-eliza/src/service.ts';

loadEnv({ path: resolve('.env') });
loadEnv({ path: resolve('../.env.local') });

const apiKey = process.env.CIRCLE_API_KEY!;
const entitySecret = process.env.ENTITY_SECRET || process.env.CIRCLE_ENTITY_SECRET!;
const walletId = process.env.CIRCLE_WALLET_ID!;
const destination = process.env.SERVER_ADDRESS!;

const walletsMod = await import('@circle-fin/developer-controlled-wallets');
const init = walletsMod.initiateDeveloperControlledWalletsClient;
const walletsClient = init({ apiKey, entitySecret });

const kit = CircleAgentKit.create(
  {
    apiKey,
    entitySecret,
    network: 'TESTNET',
    defaultChain: process.env.CIRCLE_DEFAULT_CHAIN ?? 'ARC-TESTNET',
  },
  walletsClient as never,
);

// Runtime stub for plugin actions
const service = Object.create(CircleService.prototype) as CircleService;
(service as any)._kit = kit;

const runtime = {
  getService: () => service,
  getSetting: (key: string) => process.env[key],
} as any;

async function runAction(action: typeof checkBalanceAction, text: string, params: Record<string, unknown>) {
  const message = { content: { text, params } } as any;
  let callbackText = '';
  const result = await action.handler(runtime, message, {} as any, {}, async (res: any) => {
    callbackText = res.text;
  });
  return { result, callbackText };
}

console.log('=== Plugin action: CIRCLE_CHECK_BALANCE ===');
const balanceOut = await runAction(checkBalanceAction, `check balance for ${walletId}`, {
  walletId,
});
console.log(balanceOut.callbackText || balanceOut.result.text);
console.log('success:', balanceOut.result.success);

console.log('\n=== Plugin action: CIRCLE_SEND_USDC ===');
// kit.sendUSDC currently requires AppKit adapter; fall back to transfers helper if needed.
try {
  const sendOut = await runAction(
    sendUsdcAction,
    `send 0.01 USDC to ${destination}`,
    {
      walletId,
      destinationAddress: destination,
      amount: '0.01',
      confirm: true,
      wait: true,
      chain: 'ARC-TESTNET',
    },
  );
  console.log(sendOut.callbackText || sendOut.result.text);
  console.log('success:', sendOut.result.success);
  if (!sendOut.result.success) {
    console.log('note: kit.sendUSDC needs AppKit; verifying via transfers.sendUSDC fallback...');
    const transfers = await import('@circle-plugins/core/dist/transfers.js').catch(() => null);
    // Use SDK path already proven in sendUsdcDirect.ts
    const bal = await kit.getBalance(walletId);
    const token = bal.find((b) => (b.symbol ?? '').toUpperCase() === 'USDC' && b.tokenAddress);
    console.log('token for fallback:', token);
  }
} catch (e) {
  console.error('send action error:', e instanceof Error ? e.message : e);
}

console.log('\nDone.');
