import { env } from '../../config/env.js';
import type {
  LLMCompletionInput,
  LLMCompletionResult,
  LLMProvider,
  LLMStreamHandler,
} from '../interfaces.js';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string }; delta?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export class OpenAICompatibleProductionProvider implements LLMProvider {
  readonly name = 'openai_compatible';
  readonly model: string;

  constructor(
    private readonly config: {
      baseUrl: string;
      model: string;
      apiKey?: string;
      temperature: number;
      costPer1kInputMicroUsd: number;
      costPer1kOutputMicroUsd: number;
    } = {
      baseUrl: env.LLM_BASE_URL,
      model: env.LLM_MODEL,
      apiKey: env.LLM_API_KEY,
      temperature: env.LLM_TEMPERATURE,
      costPer1kInputMicroUsd: env.LLM_COST_PER_1K_INPUT_MICRO_USD,
      costPer1kOutputMicroUsd: env.LLM_COST_PER_1K_OUTPUT_MICRO_USD,
    },
  ) {
    this.model = config.model;
  }

  private endpoint(): string {
    return `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.config.apiKey) headers.authorization = `Bearer ${this.config.apiKey}`;
    return headers;
  }

  private body(input: LLMCompletionInput, stream: boolean): string {
    return JSON.stringify({
      model: this.config.model,
      messages: [{ role: 'system', content: input.systemPrompt }, ...input.messages],
      max_tokens: input.maxOutputTokens,
      temperature: input.temperature ?? this.config.temperature,
      stream,
    });
  }

  private cost(promptTokens: number, completionTokens: number): number {
    const input = (this.config.costPer1kInputMicroUsd * promptTokens) / 1000;
    const output = (this.config.costPer1kOutputMicroUsd * completionTokens) / 1000;
    return (input + output) / 1_000_000;
  }

  private async ensureOk(response: Response): Promise<void> {
    if (response.ok) return;
    throw new Error(`Provider responded ${response.status} ${response.statusText}`);
  }

  async complete(input: LLMCompletionInput): Promise<LLMCompletionResult> {
    const startedAt = Date.now();
    const response = await fetch(this.endpoint(), {
      method: 'POST',
      headers: this.headers(),
      body: this.body(input, false),
      signal: input.signal,
    });
    await this.ensureOk(response);

    const payload = (await response.json()) as ChatCompletionResponse;
    const text = payload.choices?.[0]?.message?.content ?? '';
    const promptTokens = payload.usage?.prompt_tokens ?? estimateTokens(input.systemPrompt);
    const completionTokens = payload.usage?.completion_tokens ?? estimateTokens(text);

    return {
      text,
      latencyMs: Date.now() - startedAt,
      promptTokens,
      completionTokens,
      estimatedCostUsd: this.cost(promptTokens, completionTokens),
    };
  }

  async stream(input: LLMCompletionInput, onDelta: LLMStreamHandler): Promise<LLMCompletionResult> {
    const startedAt = Date.now();
    const response = await fetch(this.endpoint(), {
      method: 'POST',
      headers: this.headers(),
      body: this.body(input, true),
      signal: input.signal,
    });
    await this.ensureOk(response);

    if (!response.body) {
      throw new Error('Provider returned no response body for a streaming request');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let usage: ChatCompletionResponse['usage'];

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;

        let chunk: ChatCompletionResponse;
        try {
          chunk = JSON.parse(data) as ChatCompletionResponse;
        } catch {
          continue;
        }
        if (chunk.usage) usage = chunk.usage;
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          text += delta;
          onDelta(delta);
        }
      }
    }

    const promptTokens = usage?.prompt_tokens ?? estimateTokens(input.systemPrompt);
    const completionTokens = usage?.completion_tokens ?? estimateTokens(text);

    return {
      text,
      latencyMs: Date.now() - startedAt,
      promptTokens,
      completionTokens,
      estimatedCostUsd: this.cost(promptTokens, completionTokens),
    };
  }
}