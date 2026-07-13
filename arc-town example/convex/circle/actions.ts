'use node';

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import {
  checkBalance,
  circleEnabled,
  requestFaucet,
  sendUsdc,
  showWallet,
} from './wallets';
import { CircleActionKind } from './intent';

export const runTownCircleAction = internalAction({
  args: {
    kind: v.union(
      v.literal('balance'),
      v.literal('wallet'),
      v.literal('faucet'),
      v.literal('send'),
    ),
    destinationAddress: v.optional(v.string()),
    amount: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<{ ok: boolean; kind: CircleActionKind; text: string }> => {
    if (!circleEnabled()) {
      return {
        ok: false,
        kind: args.kind,
        text: 'Circle wallets are disabled (set ENABLE_CIRCLE_PLUGIN=true).',
      };
    }
    try {
      let text: string;
      switch (args.kind) {
        case 'balance':
          text = await checkBalance();
          break;
        case 'wallet':
          text = await showWallet();
          break;
        case 'faucet':
          text = await requestFaucet();
          break;
        case 'send':
          text = await sendUsdc({
            destinationAddress: args.destinationAddress,
            amount: args.amount,
            // Don't block the whole game step for long polls — still wait a bit.
            wait: true,
          });
          break;
        default:
          text = 'Unknown Circle action.';
      }
      console.log(`[circle] ${args.kind}: ${text}`);
      return { ok: true, kind: args.kind, text };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[circle] ${args.kind} failed: ${message}`);
      return {
        ok: false,
        kind: args.kind,
        text: `Circle ${args.kind} failed: ${message}`,
      };
    }
  },
});
