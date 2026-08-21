import type {
  LLMCompletionInput,
  LLMCompletionResult,
  LLMProvider,
  LLMStreamHandler,
} from '../interfaces.js';

/**
 * Deterministic in-process provider used to exercise the full companion pipeline
 * without a vendor account. It reads the same prompt a real provider receives, so
 * swapping in a vendor adapter requires no changes above this layer.
 *
 * It is NOT a language model: it selects a persona-consistent reply shape.
 */

const OPENERS = ['warm', 'curious', 'steady', 'playful'] as const;

const REPLIES: Record<(typeof OPENERS)[number], string[]> = {
  warm: [
    'That means a lot to me, thank you for telling me.',
    'I am glad you said that out loud.',
    'I am here, take your time.',
  ],
  curious: [
    'What made you think about that today?',
    'Tell me the part you left out.',
    'How long has that been on your mind?',
  ],
  steady: [
    'That sounds heavy. Let us take it one piece at a time.',
    'Understood. What would help most right now?',
    'I follow you. What happened next?',
  ],
  playful: [
    'Okay, now that is a story I want the rest of.',
    'You are full of surprises today.',
    'I like where this is going.',
  ],
};

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) % 1_000_003;
  }
  return result;
}

function lastUserMessage(input: LLMCompletionInput): string {
  for (let index = input.messages.length - 1; index >= 0; index -= 1) {
    if (input.messages[index].role === 'user') return input.messages[index].content;
  }
  return '';
}

export class DemoLLMProvider implements LLMProvider {
  readonly name = 'demo';

  constructor(readonly model: string = 'aura-demo-1') {}

  async complete(input: LLMCompletionInput): Promise<LLMCompletionResult> {
    const startedAt = Date.now();
    const text = this.resolveText(input);

    return {
      text,
      latencyMs: Math.max(1, Date.now() - startedAt),
      estimatedCostUsd: 0,
      promptTokens: this.promptTokens(input),
      completionTokens: Math.ceil(text.length / 4),
    };
  }

  /** Word-by-word so the streaming path is exercised end to end without a vendor. */
  async stream(input: LLMCompletionInput, onDelta: LLMStreamHandler): Promise<LLMCompletionResult> {
    const startedAt = Date.now();
    const text = this.resolveText(input);

    for (const [index, word] of text.split(' ').entries()) {
      if (input.signal?.aborted) {
        throw new Error('Generation aborted');
      }
      onDelta(index === 0 ? word : ` ${word}`);
    }

    return {
      text,
      latencyMs: Math.max(1, Date.now() - startedAt),
      estimatedCostUsd: 0,
      promptTokens: this.promptTokens(input),
      completionTokens: Math.ceil(text.length / 4),
    };
  }

  private promptTokens(input: LLMCompletionInput): number {
    const messageLength = input.messages.reduce((total, message) => total + message.content.length, 0);
    return Math.ceil((input.systemPrompt.length + messageLength) / 4);
  }

  private resolveText(input: LLMCompletionInput): string {
    const message = lastUserMessage(input);
    const seed = hash(`${input.systemPrompt}|${message}`);
    const opener = OPENERS[seed % OPENERS.length];
    const pool = REPLIES[opener];
    return pool[Math.floor(seed / OPENERS.length) % pool.length];
  }
}
