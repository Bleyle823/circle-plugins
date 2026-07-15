import clsx from 'clsx';
import { useMutation, useQuery } from 'convex/react';
import { KeyboardEvent, useCallback, useRef, useState } from 'react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useSendInput } from '../hooks/sendInput';
import { Player } from '../../convex/aiTown/player';
import { Conversation } from '../../convex/aiTown/conversation';
import usdcLogo from '../../assets/ui/usdc.png';

const CIRCLE_WALLET_PROMPTS = [
  {
    id: 'balance',
    label: 'Check balance',
    text: 'Please use your Circle wallet tools to check your USDC balance on Arc Testnet, then tell me the result.',
  },
  {
    id: 'wallet',
    label: 'Show wallet',
    text: 'Please use your Circle wallet tools to create a wallet if needed, then share your wallet address and confirm it is on Arc Testnet.',
  },
  {
    id: 'faucet',
    label: 'Request faucet',
    text: 'Please use your Circle wallet tools to request testnet USDC from the Circle faucet, then tell me what happened.',
  },
  {
    id: 'send',
    label: 'Send USDC',
    text: 'Please use your Circle wallet tools to send 1 USDC on Arc Testnet as a demo, then tell me the transfer result including the word USDC.',
  },
] as const;

export function MessageInput({
  worldId,
  engineId,
  humanPlayer,
  conversation,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  humanPlayer: Player;
  conversation: Conversation;
}) {
  const descriptions = useQuery(api.world.gameDescriptions, { worldId });
  const humanName = descriptions?.playerDescriptions.find((p) => p.playerId === humanPlayer.id)
    ?.name;
  const inputRef = useRef<HTMLParagraphElement>(null);
  const inflightUuid = useRef<string | undefined>();
  const [sendingPromptId, setSendingPromptId] = useState<string | null>(null);
  const [showCirclePrompts, setShowCirclePrompts] = useState(true);
  const writeMessage = useMutation(api.messages.writeMessage);
  const startTyping = useSendInput(engineId, 'startTyping');
  const currentlyTyping = conversation.isTyping;

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      let messageUuid = inflightUuid.current;
      if (currentlyTyping && currentlyTyping.playerId === humanPlayer.id) {
        messageUuid = currentlyTyping.messageUuid;
      }
      messageUuid = messageUuid || crypto.randomUUID();
      await writeMessage({
        worldId,
        playerId: humanPlayer.id,
        conversationId: conversation.id,
        text: trimmed,
        messageUuid,
      });
    },
    [conversation.id, currentlyTyping, humanPlayer.id, worldId, writeMessage],
  );

  const onKeyDown = async (e: KeyboardEvent) => {
    e.stopPropagation();

    // Set the typing indicator if we're not submitting.
    if (e.key !== 'Enter') {
      if (currentlyTyping || inflightUuid.current !== undefined) {
        return;
      }
      inflightUuid.current = crypto.randomUUID();
      try {
        // Don't show a toast on error.
        await startTyping({
          playerId: humanPlayer.id,
          conversationId: conversation.id,
          messageUuid: inflightUuid.current,
        });
      } finally {
        inflightUuid.current = undefined;
      }
      return;
    }

    // Send the current message.
    e.preventDefault();
    if (!inputRef.current) {
      return;
    }
    const text = inputRef.current.innerText;
    inputRef.current.innerText = '';
    await sendText(text);
  };

  const onCirclePrompt = async (prompt: (typeof CIRCLE_WALLET_PROMPTS)[number]) => {
    if (sendingPromptId) {
      return;
    }
    setSendingPromptId(prompt.id);
    try {
      await sendText(prompt.text);
    } finally {
      setSendingPromptId(null);
    }
  };

  return (
    <div className="leading-tight mb-6">
      <div className="flex gap-4">
        <span className="uppercase flex-grow">{humanName}</span>
      </div>

      <div className="mb-3 rounded border-2 border-[#6d4c30] bg-[#f6e2b0]/px-2 py-2 text-[#3b2a21]">
        <button
          type="button"
          className="mb-2 flex w-full items-center gap-2 text-left font-display text-sm font-bold uppercase tracking-wide"
          onClick={() => setShowCirclePrompts((open) => !open)}
        >
          <img src={usdcLogo} alt="" className="h-4 w-4 shrink-0" width={16} height={16} />
          <span className="flex-grow">Ask about Circle wallets</span>
          <span aria-hidden>{showCirclePrompts ? '▾' : '▸'}</span>
        </button>
        {showCirclePrompts && (
          <div className="flex flex-wrap gap-2">
            {CIRCLE_WALLET_PROMPTS.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                disabled={sendingPromptId !== null}
                onClick={() => void onCirclePrompt(prompt)}
                className={clsx(
                  'border-2 border-[#6d4c30] bg-[#8b6b4a] px-2 py-1 font-display text-xs font-bold tracking-wide text-[#f6e2b0]',
                  'shadow-[0_2px_0_#3b2a21] active:translate-y-[2px] active:shadow-none',
                  'disabled:cursor-wait disabled:opacity-60',
                )}
              >
                {sendingPromptId === prompt.id ? 'Sending…' : prompt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={clsx('bubble', 'bubble-mine')}>
        <p
          className="bg-white -mx-3 -my-1"
          ref={inputRef}
          contentEditable
          style={{ outline: 'none' }}
          tabIndex={0}
          placeholder="Type here"
          onKeyDown={(e) => onKeyDown(e)}
        />
      </div>
    </div>
  );
}
