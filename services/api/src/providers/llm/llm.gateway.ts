import { env } from '../../config/env.js';
import type {
  LLMCompletionInput,
  LLMCompletionResult,
  LLMProvider,
  LLMStreamHandler,
} from '../interfaces.js';

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface ProviderHealth {
  provider: string;
  model: string;
  circuit: CircuitState;
  consecutiveFailures: number;
  lastErrorCode: string | null;
  lastErrorAt: string | null;
  lastSuccessAt: string | null;
  /** Populated only while the circuit is open. */
  retryAfterMs: number | null;
}

export class LlmGatewayError extends Error {
  constructor(
    readonly code: 'PROVIDER_TIMEOUT' | 'PROVIDER_UNAVAILABLE' | 'PROVIDER_ERROR' | 'EMPTY_COMPLETION',
    message: string,
  ) {
    super(message);
    this.name = 'LlmGatewayError';
  }
}

function isRetryable(error: unknown): boolean {
  if (error instanceof LlmGatewayError) {
    return error.code === 'PROVIDER_TIMEOUT' || error.code === 'PROVIDER_ERROR';
  }
  return true;
}

/**
 * The gateway is the only place that talks to a provider. It owns timeout, retry,
 * circuit breaking and health so every provider — demo, hosted vendor or self-hosted
 * open-weight model — behaves identically to the Character Engine above it.
 */
export class LlmGateway {
  private consecutiveFailures = 0;
  private openedAt: number | null = null;
  private lastErrorCode: string | null = null;
  private lastErrorAt: number | null = null;
  private lastSuccessAt: number | null = null;

  constructor(
    private readonly provider: LLMProvider,
    private readonly options: {
      timeoutMs: number;
      maxAttempts: number;
      failureThreshold: number;
      resetMs: number;
    } = {
      timeoutMs: env.LLM_TIMEOUT_MS,
      maxAttempts: env.LLM_MAX_ATTEMPTS,
      failureThreshold: env.LLM_CIRCUIT_FAILURE_THRESHOLD,
      resetMs: env.LLM_CIRCUIT_RESET_MS,
    },
  ) {}

  get name(): string {
    return this.provider.name;
  }

  get model(): string {
    return this.provider.model;
  }

  /** True when the provider can actually produce text (the noop provider cannot). */
  get configured(): boolean {
    return this.provider.name !== 'none';
  }

  get supportsStreaming(): boolean {
    return typeof this.provider.stream === 'function';
  }

  health(): ProviderHealth {
    const circuit = this.circuitState();
    return {
      provider: this.provider.name,
      model: this.provider.model,
      circuit,
      consecutiveFailures: this.consecutiveFailures,
      lastErrorCode: this.lastErrorCode,
      lastErrorAt: this.lastErrorAt ? new Date(this.lastErrorAt).toISOString() : null,
      lastSuccessAt: this.lastSuccessAt ? new Date(this.lastSuccessAt).toISOString() : null,
      retryAfterMs:
        circuit === 'open' && this.openedAt !== null
          ? Math.max(0, this.options.resetMs - (Date.now() - this.openedAt))
          : null,
    };
  }

  /**
   * Single entry point. `onDelta` is optional: when supplied and the provider supports
   * streaming, text arrives incrementally; otherwise the same result resolves at once.
   * Callers never branch on provider capability.
   */
  async generate(input: LLMCompletionInput, onDelta?: LLMStreamHandler): Promise<LLMCompletionResult> {
    if (this.circuitState() === 'open') {
      throw new LlmGatewayError(
        'PROVIDER_UNAVAILABLE',
        `Provider "${this.provider.name}" is temporarily unavailable`,
      );
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt += 1) {
      try {
        const result = await this.attempt(input, onDelta);
        this.recordSuccess();
        return result;
      } catch (error) {
        lastError = error;
        if (attempt === this.options.maxAttempts || !isRetryable(error)) break;
      }
    }

    this.recordFailure(lastError);
    throw lastError instanceof LlmGatewayError
      ? lastError
      : new LlmGatewayError('PROVIDER_ERROR', lastError instanceof Error ? lastError.message : 'Unknown provider error');
  }

  private async attempt(input: LLMCompletionInput, onDelta?: LLMStreamHandler): Promise<LLMCompletionResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
    const startedAt = Date.now();

    try {
      const request: LLMCompletionInput = { ...input, signal: controller.signal };
      const call =
        onDelta && this.provider.stream
          ? this.provider.stream(request, onDelta)
          : this.provider.complete(request);

      const result = await Promise.race([call, this.timeout(controller.signal)]);
      const text = result.text.trim();
      if (!text) {
        throw new LlmGatewayError('EMPTY_COMPLETION', 'Provider returned an empty completion');
      }
      return { ...result, text, latencyMs: result.latencyMs || Date.now() - startedAt };
    } catch (error) {
      if (error instanceof LlmGatewayError) throw error;
      if (controller.signal.aborted) {
        throw new LlmGatewayError('PROVIDER_TIMEOUT', `Provider timed out after ${this.options.timeoutMs}ms`);
      }
      throw new LlmGatewayError('PROVIDER_ERROR', error instanceof Error ? error.message : 'Unknown provider error');
    } finally {
      clearTimeout(timer);
    }
  }

  private timeout(signal: AbortSignal): Promise<never> {
    return new Promise((_resolve, reject) => {
      signal.addEventListener(
        'abort',
        () => reject(new LlmGatewayError('PROVIDER_TIMEOUT', `Provider timed out after ${this.options.timeoutMs}ms`)),
        { once: true },
      );
    });
  }

  private circuitState(): CircuitState {
    if (this.openedAt === null) return 'closed';
    return Date.now() - this.openedAt >= this.options.resetMs ? 'half_open' : 'open';
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = null;
    this.lastSuccessAt = Date.now();
  }

  private recordFailure(error: unknown): void {
    this.consecutiveFailures += 1;
    this.lastErrorAt = Date.now();
    this.lastErrorCode = error instanceof LlmGatewayError ? error.code : 'PROVIDER_ERROR';
    if (this.consecutiveFailures >= this.options.failureThreshold) {
      this.openedAt = Date.now();
    }
  }
}
