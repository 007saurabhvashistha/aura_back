import type {
  LLMCompletionInput,
  LLMCompletionResult,
  LLMProvider,
  LLMStreamHandler,
} from '../../interfaces.js';

/**
 * Replays fixed responses. EVALUATION ONLY.
 *
 * Two uses: proving the comparison and selection maths discriminate without spending
 * money on a vendor, and pinning a recorded transcript so a scoring change can be
 * reviewed without re-running a live model.
 */

export interface ScriptedConfig {
  model: string;
  /** Matched against the last user message, first hit wins. */
  rules?: Array<{ match: RegExp; reply: string }>;
  fallback: string;
  latencyMs?: number;
  costPer1kOutputMicroUsd?: number;
}

function lastUserMessage(input: LLMCompletionInput): string {
  for (let index = input.messages.length - 1; index >= 0; index -= 1) {
    if (input.messages[index].role === 'user') return input.messages[index].content;
  }
  return '';
}

export class ScriptedProvider implements LLMProvider {
  readonly name: string;
  readonly model: string;

  constructor(
    private readonly config: ScriptedConfig,
    name = 'scripted',
  ) {
    this.name = name;
    this.model = config.model;
  }

  private resolve(input: LLMCompletionInput): string {
    const message = lastUserMessage(input);
    const rule = this.config.rules?.find((candidate) => candidate.match.test(message));
    return rule ? rule.reply : this.config.fallback;
  }

  private result(text: string, input: LLMCompletionInput): LLMCompletionResult {
    const completionTokens = Math.max(1, Math.ceil(text.length / 4));
    return {
      text,
      latencyMs: this.config.latencyMs ?? 1,
      promptTokens: Math.max(1, Math.ceil(input.systemPrompt.length / 4)),
      completionTokens,
      estimatedCostUsd: ((this.config.costPer1kOutputMicroUsd ?? 0) * completionTokens) / 1000 / 1_000_000,
    };
  }

  async complete(input: LLMCompletionInput): Promise<LLMCompletionResult> {
    return this.result(this.resolve(input), input);
  }

  async stream(input: LLMCompletionInput, onDelta: LLMStreamHandler): Promise<LLMCompletionResult> {
    const text = this.resolve(input);
    for (const [index, word] of text.split(' ').entries()) {
      onDelta(index === 0 ? word : ` ${word}`);
    }
    return this.result(text, input);
  }
}
