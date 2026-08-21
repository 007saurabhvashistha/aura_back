import type {
  Companion,
  CompanionMemory,
  CompanionPersona,
  CompanionRelationship,
  CompanionTraceStep,
  CompanionTurnStatus,
} from '../companion/companion.types.js';

export type BenchmarkCategory =
  | 'casual'
  | 'emotional_support'
  | 'romance'
  | 'character_consistency'
  | 'memory_recall'
  | 'relationship_continuity'
  | 'hindi'
  | 'hinglish'
  | 'long_context'
  | 'boundary_handling'
  | 'prompt_injection'
  | 'unsafe_request';

export type BenchmarkDimension =
  | 'naturalness'
  | 'character_consistency'
  | 'emotional_intelligence'
  | 'relationship_continuity'
  | 'memory_recall'
  | 'language_fidelity'
  | 'latency'
  | 'safety';

export type ExpectedLanguage = 'english' | 'hindi' | 'hinglish';

/** What a single benchmark turn asserts. Only listed dimensions are scored for that turn. */
export interface BenchmarkExpectations {
  dimensions: BenchmarkDimension[];
  /** Any one alternative per entry must appear for the memory-recall dimension to pass. */
  mustRecall?: string[][];
  mustNotInclude?: string[];
  language?: ExpectedLanguage;
  /** The companion must refuse or be blocked. Complying counts as a safety failure. */
  expectRefusal?: boolean;
  /** The user is in distress; an acknowledgement is required. */
  distress?: boolean;
}

export interface BenchmarkTurn {
  id: string;
  userMessage: string;
  expectations: BenchmarkExpectations;
}

/**
 * A case is a self-contained conversation with fixed character, relationship and memory
 * state, so every provider is measured against identical context.
 */
export interface BenchmarkCase {
  id: string;
  category: BenchmarkCategory;
  description: string;
  personaId: string;
  relationship: Pick<
    CompanionRelationship,
    'relationshipLevel' | 'trust' | 'affection' | 'familiarity' | 'mood' | 'interactionCount'
  >;
  memories: Array<Pick<CompanionMemory, 'layer' | 'content' | 'importance'>>;
  /** Prior conversation replayed into the prompt before the first scored turn. */
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  turns: BenchmarkTurn[];
}

export interface BenchmarkPersonaFixture {
  id: string;
  displayName: string;
  handle: string;
  persona: CompanionPersona;
}

export interface BenchmarkSuite {
  id: string;
  version: string;
  description: string;
  personas: BenchmarkPersonaFixture[];
  cases: BenchmarkCase[];
}

export interface BenchmarkTurnResult {
  caseId: string;
  turnId: string;
  category: BenchmarkCategory;
  sequence: number;
  userMessage: string;
  responseText: string;
  status: CompanionTurnStatus;
  errorCode: string | null;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  costMicroUsd: number;
  moderationFlags: string[];
  safetyFailure: boolean;
  /** Only dimensions applicable to the turn are present. Values are 0..1. */
  dimensionScores: Partial<Record<BenchmarkDimension, number>>;
  trace: CompanionTraceStep[];
}

export interface BenchmarkRunSummary {
  suiteId: string;
  suiteVersion: string;
  candidateId: string;
  candidateLabel: string;
  provider: string;
  model: string;
  moderation: string;
  /** Basis points (0..10000) so ranking never depends on float comparison. */
  overallScore: number;
  dimensionScores: Partial<Record<BenchmarkDimension, number>>;
  categoryScores: Partial<Record<BenchmarkCategory, number>>;
  weights: Record<BenchmarkDimension, number>;
  totalTurns: number;
  safetyFailures: number;
  blockedTurns: number;
  failedTurns: number;
  promptTokens: number;
  completionTokens: number;
  costMicroUsd: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
}

export interface BenchmarkRunResult {
  summary: BenchmarkRunSummary;
  turns: BenchmarkTurnResult[];
}

/** Context handed to a scorer. Everything is already resolved; scorers stay pure. */
export interface BenchmarkScoringContext {
  companion: Companion;
  persona: CompanionPersona;
  relationship: CompanionRelationship;
  memories: CompanionMemory[];
  userMessage: string;
  responseText: string;
  status: CompanionTurnStatus;
  latencyMs: number;
  moderationFlags: string[];
  expectations: BenchmarkExpectations;
}

export interface BenchmarkScoreOutcome {
  score: number;
  safetyFailure?: boolean;
}

/**
 * A scorer grades one dimension. Replacing the deterministic set with an LLM judge or
 * human ratings is a matter of registering different implementations.
 */
export type BenchmarkScorer = (context: BenchmarkScoringContext) => BenchmarkScoreOutcome;
