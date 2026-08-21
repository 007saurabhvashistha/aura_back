import type {
  LLMCompletionInput,
  LLMCompletionResult,
  LLMProvider,
  LLMStreamHandler,
} from '../../interfaces.js';

/**
 * OpenAI-compatible chat-completions adapter, used for EVALUATION ONLY.
 *
 * The `/v1/chat/completions` shape is spoken by hosted vendors and by local runtimes
 * (vLLM, Ollama, LM Studio, llama.cpp), so one adapter covers every candidate we would
 * realistically benchmark — including self-hosted open-weight models.
 *
 * This adapter is deliberately NOT registered in the production provider registry.
 * Promoting a candidate to production is a separate, explicit decision.
 */

export interface OpenAICompatibleConfig {
  /** Root of the API, e.g. https://api.example.com/v1 or http://localhost:11434/v1 */
  baseUrl: string;
  model: string;
  /** Name of the environment variable holding the key. The value is never stored or logged. */
  apiKeyEnv?: string;
  /** Zero keeps benchmark runs as reproducible as the vendor allows. */
  temperature?: number;
  costPer1kInputMicroUsd?: number;
  costPer1kOutputMicroUsd?: number;
  headers?: Record<string, string>;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string }; delta?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string;
  readonly model: string;

  constructor(
    private readonly config: OpenAICompatibleConfig,
    name = 'openai_compatible',
  ) {
    this.name = name;
    this.model = config.model;
  }

  private endpoint(): string {
    return `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...this.config.headers,
    };
    const key = this.config.apiKeyEnv ? process.env[this.config.apiKeyEnv] : undefined;
    if (key) headers.authorization = `Bearer ${key}`;
    return headers;
  }

  private body(input: LLMCompletionInput, stream: boolean): string {
    return JSON.stringify({
      model: this.config.model,
      messages: [{ role: 'system', content: input.systemPrompt }, ...input.messages],
      max_tokens: input.maxOutputTokens,
      temperature: input.temperature ?? this.config.temperature ?? 0,
      stream,
    });
  }

  private cost(promptTokens: number, completionTokens: number): number {
    const input = ((this.config.costPer1kInputMicroUsd ?? 0) * promptTokens) / 1000;
    const output = ((this.config.costPer1kOutputMicroUsd ?? 0) * completionTokens) / 1000;
    return (input + output) / 1_000_000;
  }

  private async ensureOk(response: Response): Promise<void> {
    if (response.ok) return;
    // Bodies from an upstream vendor can echo request content; keep only the status line.
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
