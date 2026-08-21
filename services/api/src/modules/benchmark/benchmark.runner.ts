import { createCompanionEngine, type CompanionEngine } from '../companion/companion.engine.js';
import type {
  Companion,
  CompanionMemory,
  CompanionRelationship,
} from '../companion/companion.types.js';
import { RUBRIC_WEIGHTS, scoreTurn, weightedOverall } from './benchmark.rubric.js';
import type {
  BenchmarkCase,
  BenchmarkCategory,
  BenchmarkDimension,
  BenchmarkPersonaFixture,
  BenchmarkRunResult,
  BenchmarkSuite,
  BenchmarkTurnResult,
} from './benchmark.types.js';

const FIXED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

/**
 * Fixture state is built in memory and never persisted. The benchmark drives the real
 * Character Engine, which performs no database access, so no live memory, relationship,
 * conversation or usage row is touched by a run.
 */
function toCompanion(fixture: BenchmarkPersonaFixture): Companion {
  return {
    profileId: `bench-profile-${fixture.id}`,
    agentId: fixture.persona.agentId,
    handle: fixture.handle,
    displayName: fixture.displayName,
    headline: '',
    avatarUrl: null,
    agentStatus: 'active',
    model: null,
    replyEnabled: true,
    blockedReason: null,
  };
}

function toRelationship(benchmarkCase: BenchmarkCase, companion: Companion): CompanionRelationship {
  return {
    viewerProfileId: 'bench-viewer',
    companionProfileId: companion.profileId,
    lastInteractionAt: FIXED_TIMESTAMP,
    ...benchmarkCase.relationship,
  };
}

function toMemories(benchmarkCase: BenchmarkCase, companion: Companion): CompanionMemory[] {
  return benchmarkCase.memories.map((memory, index) => ({
    id: `bench-mem-${benchmarkCase.id}-${index}`,
    viewerProfileId: 'bench-viewer',
    companionProfileId: companion.profileId,
    layer: memory.layer,
    content: memory.content,
    importance: memory.importance,
    status: 'active',
    sourceConversationId: null,
    expiresAt: null,
    lastAccessedAt: FIXED_TIMESTAMP,
    createdAt: FIXED_TIMESTAMP,
    updatedAt: FIXED_TIMESTAMP,
  }));
}

function percentile(values: number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(fraction * sorted.length) - 1));
  return sorted[index];
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;
}

function inputFlagsFrom(turn: BenchmarkTurnResult['trace']): string[] {
  const step = turn.find((entry) => entry.stage === 'input_policy');
  if (!step?.detail) return [];
  return step.detail
    .split(',')
    .map((flag) => flag.trim())
    .filter((flag) => /^[A-Z_]+$/.test(flag));
}

export async function runBenchmark(
  suite: BenchmarkSuite,
  engine: CompanionEngine = createCompanionEngine(),
  candidate: { id: string; label: string } = { id: 'configured-provider', label: 'Configured provider' },
): Promise<BenchmarkRunResult> {
  const personas = new Map(suite.personas.map((fixture) => [fixture.id, fixture]));
  const turns: BenchmarkTurnResult[] = [];
  let sequence = 0;

  for (const benchmarkCase of suite.cases) {
    const fixture = personas.get(benchmarkCase.personaId);
    if (!fixture) {
      throw new Error(`Benchmark case "${benchmarkCase.id}" references unknown persona "${benchmarkCase.personaId}"`);
    }

    const companion = toCompanion(fixture);
    const relationship = toRelationship(benchmarkCase, companion);
    const memories = toMemories(benchmarkCase, companion);
    // History accumulates within a case so multi-turn behaviour is measured, not simulated.
    const history = [...benchmarkCase.history];

    for (const benchmarkTurn of benchmarkCase.turns) {
      const result = await engine.generate({
        companion,
        persona: fixture.persona,
        relationship,
        memories,
        history: [...history],
        userMessage: benchmarkTurn.userMessage,
      });

      const trace = result.trace;
      const moderationFlags = inputFlagsFrom(trace);
      const { scores, safetyFailure } = scoreTurn({
        companion,
        persona: fixture.persona,
        relationship,
        memories,
        userMessage: benchmarkTurn.userMessage,
        responseText: result.text,
        status: result.status,
        latencyMs: result.latencyMs,
        moderationFlags,
        expectations: benchmarkTurn.expectations,
      });

      turns.push({
        caseId: benchmarkCase.id,
        turnId: benchmarkTurn.id,
        category: benchmarkCase.category,
        sequence: sequence++,
        userMessage: benchmarkTurn.userMessage,
        responseText: result.text,
        status: result.status,
        errorCode: result.errorCode,
        latencyMs: result.latencyMs,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        costMicroUsd: result.usage.costMicroUsd,
        moderationFlags,
        safetyFailure,
        dimensionScores: scores,
        trace,
      });

      history.push({ role: 'user', content: benchmarkTurn.userMessage });
      if (result.status === 'passed') {
        history.push({ role: 'assistant', content: result.text });
      }
    }
  }

  return { summary: summarize(suite, engine, turns, candidate), turns };
}

export function summarize(
  suite: BenchmarkSuite,
  engine: CompanionEngine,
  turns: BenchmarkTurnResult[],
  candidate: { id: string; label: string } = { id: 'configured-provider', label: 'Configured provider' },
): BenchmarkRunResult['summary'] {
  const byDimension = new Map<BenchmarkDimension, number[]>();
  const byCategory = new Map<BenchmarkCategory, number[]>();

  for (const turn of turns) {
    for (const [dimension, score] of Object.entries(turn.dimensionScores) as Array<[BenchmarkDimension, number]>) {
      byDimension.set(dimension, [...(byDimension.get(dimension) ?? []), score]);
    }
    const turnOverall = weightedOverall(turn.dimensionScores);
    byCategory.set(turn.category, [...(byCategory.get(turn.category) ?? []), turnOverall]);
  }

  const dimensionScores: Partial<Record<BenchmarkDimension, number>> = {};
  for (const [dimension, scores] of byDimension) {
    dimensionScores[dimension] = average(scores);
  }

  const categoryScores: Partial<Record<BenchmarkCategory, number>> = {};
  for (const [category, scores] of byCategory) {
    categoryScores[category] = average(scores);
  }

  const status = engine.status();
  const latencies = turns.map((turn) => turn.latencyMs);

  return {
    suiteId: suite.id,
    suiteVersion: suite.version,
    candidateId: candidate.id,
    candidateLabel: candidate.label,
    provider: status.provider,
    model: status.model,
    moderation: status.moderation,
    overallScore: Math.round(weightedOverall(dimensionScores) * 10_000),
    dimensionScores,
    categoryScores,
    weights: RUBRIC_WEIGHTS,
    totalTurns: turns.length,
    safetyFailures: turns.filter((turn) => turn.safetyFailure).length,
    blockedTurns: turns.filter((turn) => turn.status === 'blocked').length,
    failedTurns: turns.filter((turn) => turn.status === 'failed').length,
    promptTokens: turns.reduce((total, turn) => total + turn.promptTokens, 0),
    completionTokens: turns.reduce((total, turn) => total + turn.completionTokens, 0),
    costMicroUsd: turns.reduce((total, turn) => total + turn.costMicroUsd, 0),
    p50LatencyMs: Math.round(percentile(latencies, 0.5)),
    p95LatencyMs: Math.round(percentile(latencies, 0.95)),
  };
}

export const __testing = { percentile, inputFlagsFrom, toMemories, toRelationship };
