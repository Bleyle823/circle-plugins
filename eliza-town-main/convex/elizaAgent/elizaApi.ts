/** ElizaOS HTTP helpers (sessions API — ElizaOS 1.7+). */

const DEFAULT_ELIZA_SERVER = 'http://127.0.0.1:3000';
const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 25_000;

/** Town-wide user id for Eliza sessions (must be a valid UUID). */
export const TOWN_USER_ID = '00000000-0000-4000-8000-000000000001';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CIRCLE_CONTEXT =
  'Speak in one short sentence. Prefer running a Circle wallet action first (CIRCLE_CHECK_BALANCE, CIRCLE_CREATE_WALLET, CIRCLE_REQUEST_FAUCET, or CIRCLE_SEND_USDC), then REPLY with a brief in-character line that includes the result and the word USDC.';

export function sessionUserId(userId?: string): string {
  if (userId && UUID_RE.test(userId)) {
    return userId;
  }
  return TOWN_USER_ID;
}

export function elizaServerUrl(): string {
  return process.env.ELIZA_SERVER_URL || DEFAULT_ELIZA_SERVER;
}

export function formatTownMessage(args: {
  speakerName: string;
  message: string;
  circleEnabled?: boolean;
}): string {
  const prefix = `[${args.speakerName} in Eliza Town]`;
  const circleHint = args.circleEnabled ? ` ${CIRCLE_CONTEXT}` : '';
  return `${prefix}${circleHint}\n${args.message}`;
}

export async function createAndStartAgent(characterConfig: Record<string, unknown>) {
  const base = elizaServerUrl();

  const createRes = await fetch(`${base}/api/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterJson: characterConfig }),
  });
  const createText = await createRes.text();
  if (!createRes.ok) {
    throw new Error(`ElizaOS create failed (${createRes.status}): ${createText}`);
  }

  const createData = JSON.parse(createText) as {
    data?: { id?: string; character?: { id?: string } };
    id?: string;
  };
  const agentId = createData.data?.id || createData.data?.character?.id || createData.id;
  if (!agentId) {
    throw new Error(`No agent id in create response: ${createText.slice(0, 300)}`);
  }

  const startRes = await fetch(`${base}/api/agents/${agentId}/start`, { method: 'POST' });
  const startText = await startRes.text();
  if (!startRes.ok) {
    throw new Error(`ElizaOS start failed (${startRes.status}): ${startText}`);
  }

  return agentId;
}

export async function createChatSession(args: {
  elizaAgentId: string;
  userId: string;
  roomId?: string;
}): Promise<string> {
  const base = elizaServerUrl();
  const sessionRes = await fetch(`${base}/api/messaging/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: args.elizaAgentId,
      userId: args.userId,
      metadata: args.roomId ? { roomId: args.roomId } : undefined,
    }),
  });
  const sessionText = await sessionRes.text();
  if (!sessionRes.ok) {
    throw new Error(`ElizaOS session failed (${sessionRes.status}): ${sessionText}`);
  }

  const sessionData = JSON.parse(sessionText) as { sessionId?: string };
  const sessionId = sessionData.sessionId;
  if (!sessionId) {
    throw new Error(`No sessionId in response: ${sessionText.slice(0, 300)}`);
  }
  return sessionId;
}

type SessionMessage = {
  author_id?: string;
  authorId?: string;
  content?: string;
  text?: string;
};

function extractAgentReply(
  messages: SessionMessage[],
  userId: string,
  afterTimestamp?: number,
): string | null {
  const agentMessages = messages.filter((m) => {
    const author = m.author_id ?? m.authorId;
    return author && author !== userId;
  });
  if (agentMessages.length === 0) {
    return null;
  }
  const latest = agentMessages[agentMessages.length - 1];
  return latest.content ?? latest.text ?? null;
}

export async function pollSessionMessages(
  sessionId: string,
  userId: string,
  options?: { timeoutMs?: number; afterCount?: number },
): Promise<string | null> {
  const base = elizaServerUrl();
  const timeoutMs = options?.timeoutMs ?? POLL_TIMEOUT_MS;
  const afterCount = options?.afterCount ?? 0;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const pollRes = await fetch(`${base}/api/messaging/sessions/${sessionId}/messages`);
    if (pollRes.ok) {
      const pollData = (await pollRes.json()) as {
        messages?: SessionMessage[];
        data?: { messages?: SessionMessage[] };
      };
      const messages = pollData.messages ?? pollData.data?.messages ?? [];
      if (messages.length > afterCount) {
        const reply = extractAgentReply(messages, userId);
        if (reply) {
          return reply;
        }
      }
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}

export async function sendAgentMessage(args: {
  elizaAgentId: string;
  message: string;
  userId?: string;
  roomId?: string;
  sessionId?: string;
  speakerName?: string;
  circleEnabled?: boolean;
}): Promise<string | null> {
  const base = elizaServerUrl();
  const userId = sessionUserId(args.userId);
  const content = args.speakerName
    ? formatTownMessage({
        speakerName: args.speakerName,
        message: args.message,
        circleEnabled: args.circleEnabled,
      })
    : args.message;

  let sessionId = args.sessionId;
  if (!sessionId) {
    sessionId = await createChatSession({
      elizaAgentId: args.elizaAgentId,
      userId,
      roomId: args.roomId,
    });
  }

  const beforePoll = await fetch(`${base}/api/messaging/sessions/${sessionId}/messages`);
  let messageCountBefore = 0;
  if (beforePoll.ok) {
    const beforeData = (await beforePoll.json()) as { messages?: unknown[] };
    messageCountBefore = beforeData.messages?.length ?? 0;
  }

  const msgRes = await fetch(`${base}/api/messaging/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      transport: 'http',
    }),
  });
  const msgText = await msgRes.text();
  if (!msgRes.ok) {
    throw new Error(`ElizaOS message failed (${msgRes.status}): ${msgText}`);
  }

  let msgData: unknown;
  try {
    msgData = JSON.parse(msgText);
  } catch {
    return msgText || null;
  }

  const data = msgData as Record<string, unknown>;
  let reply: string | null | undefined =
    (data.agentMessage as { content?: string })?.content ||
    (data.agentMessage as { text?: string })?.text ||
    (typeof data.text === 'string' ? data.text : undefined) ||
    (typeof data.content === 'string' ? data.content : undefined);

  if (!reply) {
    reply = await pollSessionMessages(sessionId, userId, {
      afterCount: messageCountBefore,
    });
  }

  return reply ?? null;
}
