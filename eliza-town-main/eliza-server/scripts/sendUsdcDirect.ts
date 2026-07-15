import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

loadEnv({ path: resolve('.env') });

const apiKey = process.env.CIRCLE_API_KEY!;
const entitySecret = process.env.ENTITY_SECRET || process.env.CIRCLE_ENTITY_SECRET!;
const walletId = process.env.CIRCLE_WALLET_ID!;
const destination = process.env.SERVER_ADDRESS!;
const amount = process.env.CIRCLE_TEST_SEND_AMOUNT || '0.01';

const mod = await import('@circle-fin/developer-controlled-wallets');
const client = mod.initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });

console.log('=== Direct SDK send USDC test ===');
console.log({ walletId, destination, amount });

const balRes = await client.getWalletTokenBalance({ id: walletId });
const balances = balRes?.data?.tokenBalances ?? [];
const usdc = balances.find(
  (b: any) =>
    (b.token?.symbol ?? '').toUpperCase() === 'USDC' &&
    b.token?.tokenAddress &&
    Number(b.token?.decimals) === 6,
);
if (!usdc?.token?.id) {
  throw new Error('Could not find 6-decimal USDC token with tokenId');
}

const tokenId = usdc.token.id;
console.log('using tokenId', tokenId, 'amount available', usdc.amount);

try {
  const res = await client.createTransaction({
    walletId,
    tokenId,
    destinationAddress: destination,
    amounts: [amount],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
    idempotencyKey: randomUUID(),
  });
  console.log('createTransaction ok:', JSON.stringify(res?.data ?? res, null, 2));

  const id = res?.data?.id;
  if (!id) throw new Error('No transaction id');

  for (let i = 0; i < 40; i++) {
    const txRes = await client.getTransaction({ id });
    const tx = txRes?.data?.transaction ?? txRes?.data;
    console.log(`poll ${i}: state=${tx?.state} hash=${tx?.txHash ?? ''}`);
    if (['COMPLETE', 'FAILED', 'DENIED', 'CANCELLED'].includes(String(tx?.state))) {
      console.log('final state:', tx?.state);
      break;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
} catch (e: any) {
  console.error('SEND FAILED');
  console.error('message:', e?.message);
  console.error('status:', e?.status ?? e?.statusCode);
  try {
    console.error('body:', JSON.stringify(e?.body ?? e?.data ?? e?.error, null, 2));
  } catch {
    console.error('body unserializable');
  }
  process.exit(1);
}

const after = await client.getWalletTokenBalance({ id: walletId });
const afterUsdc = (after?.data?.tokenBalances ?? []).map((b: any) => ({
  symbol: b.token?.symbol,
  amount: b.amount,
  decimals: b.token?.decimals,
}));
console.log('balances after:', JSON.stringify(afterUsdc, null, 2));
console.log('✅ send done');
