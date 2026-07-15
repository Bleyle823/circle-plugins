'use node';

import { randomUUID } from 'node:crypto';

type WalletsClient = {
  getWallet: (args: { id: string }) => Promise<any>;
  getWalletTokenBalance: (args: { id: string }) => Promise<any>;
  createTransaction: (args: Record<string, unknown>) => Promise<any>;
  getTransaction: (args: { id: string }) => Promise<any>;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

export function circleEnabled(): boolean {
  return process.env.ENABLE_CIRCLE_PLUGIN === 'true';
}

export function circleConfig() {
  const apiKey = requireEnv('CIRCLE_API_KEY');
  const entitySecret =
    process.env.ENTITY_SECRET?.trim() || requireEnv('CIRCLE_ENTITY_SECRET');
  const walletId = requireEnv('CIRCLE_WALLET_ID');
  return {
    apiKey,
    entitySecret,
    walletId,
    destination:
      process.env.SERVER_ADDRESS?.trim() ||
      process.env.CIRCLE_TEST_DESTINATION?.trim() ||
      '',
    chain: process.env.CIRCLE_DEFAULT_CHAIN?.trim() || 'ARC-TESTNET',
  };
}

export async function getWalletsClient(): Promise<WalletsClient> {
  const { apiKey, entitySecret } = circleConfig();
  const mod = await import('@circle-fin/developer-controlled-wallets');
  const init =
    (mod as any).initiateDeveloperControlledWalletsClient ??
    (mod as any).default?.initiateDeveloperControlledWalletsClient;
  if (typeof init !== 'function') {
    throw new Error('initiateDeveloperControlledWalletsClient not found');
  }
  return init({ apiKey, entitySecret }) as WalletsClient;
}

function findUsdc(balances: any[]): any | undefined {
  return balances.find(
    (b: any) =>
      (b.token?.symbol ?? '').toUpperCase() === 'USDC' &&
      b.token?.id &&
      (b.token?.tokenAddress || Number(b.token?.decimals) === 6),
  );
}

export async function checkBalance(walletId?: string): Promise<string> {
  const cfg = circleConfig();
  const id = walletId || cfg.walletId;
  const client = await getWalletsClient();
  const balRes = await client.getWalletTokenBalance({ id });
  const balances = balRes?.data?.tokenBalances ?? [];
  const usdc = findUsdc(balances);
  const amount = usdc?.amount ?? '0';
  const extra = balances.length > 1 ? ` (+${balances.length - 1} other tokens)` : '';
  return `Circle wallet balance: ${amount} USDC on Arc Testnet${extra}.`;
}

export async function showWallet(walletId?: string): Promise<string> {
  const cfg = circleConfig();
  const id = walletId || cfg.walletId;
  const client = await getWalletsClient();
  const walletRes = await client.getWallet({ id });
  const wallet = walletRes?.data?.wallet ?? walletRes?.data;
  const address = wallet?.address ?? 'unknown';
  const chain = wallet?.blockchain ?? cfg.chain;
  return `Circle wallet ${id} at ${address} on ${chain}.`;
}

export async function sendUsdc(args: {
  destinationAddress?: string;
  amount?: string;
  walletId?: string;
  wait?: boolean;
}): Promise<string> {
  const cfg = circleConfig();
  const walletId = args.walletId || cfg.walletId;
  const destinationAddress = args.destinationAddress || cfg.destination;
  if (!destinationAddress || !/^0x[a-fA-F0-9]{40}$/.test(destinationAddress)) {
    throw new Error('No valid destination address (set SERVER_ADDRESS or include a 0x address).');
  }
  const amount = args.amount || '0.01';
  const client = await getWalletsClient();

  const balRes = await client.getWalletTokenBalance({ id: walletId });
  const balances = balRes?.data?.tokenBalances ?? [];
  const usdc = findUsdc(balances);
  const tokenId = usdc?.token?.id;
  if (!tokenId) {
    throw new Error(`No USDC tokenId found for wallet ${walletId}`);
  }

  const created = await client.createTransaction({
    walletId,
    tokenId,
    destinationAddress,
    amounts: [amount],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
    idempotencyKey: randomUUID(),
  });
  const id = created?.data?.id;
  if (!id) {
    throw new Error('Transfer creation returned no transaction id.');
  }

  let state = created?.data?.state ?? 'INITIATED';
  let txHash: string | undefined;
  if (args.wait !== false) {
    const start = Date.now();
    while (Date.now() - start < 90_000) {
      const txRes = await client.getTransaction({ id });
      const tx = txRes?.data?.transaction ?? txRes?.data;
      state = tx?.state ?? state;
      txHash = tx?.txHash;
      if (['COMPLETE', 'FAILED', 'DENIED', 'CANCELLED'].includes(String(state))) {
        break;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  const explorer = txHash ? ` https://testnet.arcscan.so/tx/${txHash}` : '';
  return `Sent ${amount} USDC. Transaction ${id} is ${state}.${explorer}`;
}

/**
 * Request testnet USDC via Circle's faucet HTTP API.
 * Falls back to a clear message if the faucet rejects / is unavailable.
 */
export async function requestFaucet(walletId?: string): Promise<string> {
  const cfg = circleConfig();
  const id = walletId || cfg.walletId;
  const client = await getWalletsClient();
  const walletRes = await client.getWallet({ id });
  const wallet = walletRes?.data?.wallet ?? walletRes?.data;
  const address = wallet?.address;
  if (!address) {
    throw new Error(`Could not resolve address for wallet ${id}`);
  }

  const blockchain = (wallet?.blockchain || cfg.chain || 'ARC-TESTNET').toUpperCase();
  const res = await fetch('https://api.circle.com/v1/faucet/drips', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address,
      blockchain,
      usdc: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // Still report wallet identity so dialogue can continue usefully.
    if (res.status === 429 || /rate|limit|already/i.test(body)) {
      return `Faucet rate-limited for ${address}; Circle wallet still holds USDC on Arc Testnet.`;
    }
    throw new Error(`Faucet failed (${res.status}): ${body.slice(0, 200)}`);
  }

  return `Requested Arc Testnet faucet USDC for Circle wallet ${address}.`;
}
