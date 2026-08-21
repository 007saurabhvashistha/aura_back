import { env } from '../../config/env.js';
import type { LLMStreamHandler, ModerationProvider } from '../../providers/interfaces.js';
import { LlmGateway } from '../../providers/llm/llm.gateway.js';
import { llmProvider } from '../../providers/llm/llm.provider.js';
import { moderationProvider as defaultModerationProvider } from '../../providers/moderation/moderation.provider.js';
import type { BudgetDecision } from './companion.budget.service.js';
import type { MemoryCandidate } from './companion.memory.service.js';
import { policyFor } from './companion.memory.policy.js';
import { buildMessages, buildSystemPrompt, sanitizeUntrusted } from './companion.prompt.js';
import type {
  Companion,
  CompanionEngineResult,
  CompanionMemory,
  CompanionPersona,
  CompanionRelationship,
  CompanionTraceStep,
} from './companion.types.js';

export interface CompanionTurnRequest {
  companion: Companion;
  persona: CompanionPersona;
  relationship: CompanionRelationship;
  memories: CompanionMemory[];
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage: string;
  /** Pre-computed by the caller so the engine performs no database access. */
  budget?: BudgetDecision;
  /** Supplied by a streaming transport. The engine behaves identically without it. */
  onDelta?: LLMStreamHandler;
}

/**
 * Memory candidates are derived server-side from the user's own words rather than taken
 * from model output, so a provider swap cannot change what becomes durable memory.
 */
function deriveMemoryCandidates(userMessage: string): MemoryCandidate[] {
  const text = sanitizeUntrusted(userMessage);
  if (text.length < 12) return [];

  const explicit = /\bremember\b/i.test(text);
  const identity = /\b(i am|i'm|my name|i live|i work|i study)\b/i.test(text);
  const preference = /\b(i like|i love|i hate|i prefer|i want|i need)\b/i.test(text);
  if (!identity && !preference && !explicit) return [];

  const layer = explicit || identity ? 'important' : 'episodic';
  const importance = explicit ? 5 : identity ? 4 : 3;

  return [
    {
      content: text.slice(0, 300),
      layer,
      importance: Math.min(importance, policyFor(layer).maxImportance),
    },
  ];
}

function deriveRelationshipDelta(userMessage: string): CompanionEngineResult['relationshipDelta'] {
  const positive = /\b(thank|thanks|love|great|happy|good|appreciate)\b/i.test(userMessage);
  const negative = /\b(hate|angry|upset|stupid|shut up)\b/i.test(userMessage);
  return {
    trust: positive ? 1 : negative ? -1 : 0,
    affection: positive ? 1 : negative ? -1 : 0,
    familiarity: 1,
    mood: negative ? 'guarded' : positive ? 'warm' : undefined,
  };
}

const EMPTY_USAGE = { promptTokens: 0, completionTokens: 0, costMicroUsd: 0 };

/**
 * The Character Engine. It owns the turn contract:
 *
 *   input policy -> character -> memory + relationship -> budget -> LLM gateway ->
 *   output policy -> result
 *
 * Every dependency is injected, so the pipeline is testable without a database, a vendor
 * account or a network.
 */
export function createCompanionEngine(
  gateway: LlmGateway = new LlmGateway(llmProvider),
  moderation: ModerationProvider = defaultModerationProvider,
) {
  function stop(
    trace: CompanionTraceStep[],
    status: 'failed' | 'blocked',
    errorCode: string,
    errorMessage: string,
    latencyMs = 0,
  ): CompanionEngineResult {
    return {
      status,
      text: '',
      provider: gateway.name,
      model: gateway.model,
      latencyMs,
      streamed: false,
      usage: { ...EMPTY_USAGE },
      trace,
      memoryCandidates: [],
      relationshipDelta: {},
      errorCode,
      errorMessage,
    };
  }

  return {
    gateway,
    moderation,

    status() {
      return {
        provider: gateway.name,
        model: gateway.model,
        ready: gateway.configured,
        streaming: gateway.supportsStreaming,
        moderation: moderation.name,
        health: gateway.health(),
      };
    },

    async generate(request: CompanionTurnRequest): Promise<CompanionEngineResult> {
      const trace: CompanionTraceStep[] = [];

      const inputVerdict = await moderation.review('input', request.userMessage);
      trace.push({
        stage: 'input_policy',
        label: inputVerdict.allowed ? `Input allowed (${moderation.name})` : 'Input blocked',
        status: inputVerdict.allowed ? 'passed' : 'blocked',
        detail: inputVerdict.flags.length > 0 ? inputVerdict.flags.join(', ') : inputVerdict.reason ?? undefined,
      });
      if (!inputVerdict.allowed) {
        return stop(trace, 'blocked', inputVerdict.code ?? 'INPUT_BLOCKED', inputVerdict.reason ?? 'Message blocked');
      }

      if (!request.companion.replyEnabled) {
        trace.push({
          stage: 'character',
          label: 'Companion cannot reply',
          status: 'failed',
          detail: request.companion.blockedReason ?? undefined,
        });
        return stop(
          trace,
          'failed',
          'COMPANION_UNAVAILABLE',
          request.companion.blockedReason ?? 'Companion is unavailable',
        );
      }

      trace.push({
        stage: 'character',
        label: `Persona resolved (${request.persona.speakingStyle.tone})`,
        status: 'passed',
      });
      trace.push({ stage: 'memory', label: `${request.memories.length} memories in context`, status: 'passed' });
      trace.push({
        stage: 'relationship',
        label: `Level ${request.relationship.relationshipLevel}/10`,
        status: 'passed',
      });

      if (request.budget && !request.budget.allowed) {
        trace.push({
          stage: 'budget',
          label: 'Budget exceeded',
          status: 'blocked',
          detail: request.budget.reason ?? undefined,
        });
        return stop(
          trace,
          'blocked',
          request.budget.code ?? 'BUDGET_EXCEEDED',
          request.budget.reason ?? 'Budget exceeded',
        );
      }
      trace.push({ stage: 'budget', label: 'Within budget', status: 'passed' });

      const systemPrompt = buildSystemPrompt({
        displayName: request.companion.displayName,
        persona: request.persona,
        relationship: request.relationship,
        memories: request.memories,
      });
      const messages = buildMessages(request.history, inputVerdict.text);
      const streamed = Boolean(request.onDelta) && gateway.supportsStreaming;

      const startedAt = Date.now();
      let completion;
      try {
        completion = await gateway.generate(
          { systemPrompt, messages, maxOutputTokens: env.LLM_MAX_OUTPUT_TOKENS },
          request.onDelta,
        );
      } catch (error) {
        const code = error instanceof Error && 'code' in error ? String(error.code) : 'PROVIDER_ERROR';
        const message = error instanceof Error ? error.message : 'Unknown provider error';
        trace.push({ stage: 'gateway', label: `${gateway.name}:${gateway.model}`, status: 'failed', detail: message });
        return stop(trace, 'failed', code, message, Date.now() - startedAt);
      }

      trace.push({
        stage: 'gateway',
        label: `${gateway.name}:${gateway.model}${streamed ? ' (streamed)' : ''}`,
        status: 'passed',
        latencyMs: completion.latencyMs,
      });

      const usage = {
        promptTokens: completion.promptTokens ?? 0,
        completionTokens: completion.completionTokens ?? 0,
        costMicroUsd: Math.round((completion.estimatedCostUsd ?? 0) * 1_000_000),
      };

      const outputVerdict = await moderation.review('output', completion.text);
      trace.push({
        stage: 'output_policy',
        label: outputVerdict.allowed ? `Output allowed (${moderation.name})` : 'Output blocked',
        status: outputVerdict.allowed ? 'passed' : 'blocked',
        detail: outputVerdict.reason ?? undefined,
      });
      if (!outputVerdict.allowed) {
        // The provider already ran, so usage is still charged even though nothing is delivered.
        return {
          ...stop(
            trace,
            'blocked',
            outputVerdict.code ?? 'OUTPUT_BLOCKED',
            outputVerdict.reason ?? 'Reply blocked',
            completion.latencyMs,
          ),
          usage,
        };
      }

      trace.push({ stage: 'output', label: 'Reply generated', status: 'passed' });

      return {
        status: 'passed',
        text: outputVerdict.text,
        provider: gateway.name,
        model: gateway.model,
        latencyMs: completion.latencyMs,
        streamed,
        usage,
        trace,
        memoryCandidates: deriveMemoryCandidates(request.userMessage),
        relationshipDelta: deriveRelationshipDelta(request.userMessage),
        errorCode: null,
        errorMessage: null,
      };
    },
  };
}

export type CompanionEngine = ReturnType<typeof createCompanionEngine>;

export const companionEngine = createCompanionEngine();

export const __testing = { deriveMemoryCandidates, deriveRelationshipDelta };
