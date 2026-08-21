import { desc, eq } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { benchmarkHumanRatings, benchmarkRuns, benchmarkTurnResults } from '../../db/schema.js';
import { HttpError } from '../../utils/http_error.js';
import { allCandidates, readiness } from './candidates.js';
import { computeSelection, type SelectionResult } from './benchmark.selection.js';
import { getSuite, listSuites, suiteKey } from './dataset/index.js';
import type { BenchmarkRunResult, BenchmarkRunSummary } from './benchmark.types.js';

function requireDb() {
  const db = getDb();
  if (!db) {
    throw HttpError.badRequest('Database not available', 'DATABASE_UNAVAILABLE');
  }
  return db;
}

export interface BenchmarkComparisonRow {
  candidateId: string;
  candidateLabel: string;
  provider: string;
  model: string;
  suiteId: string;
  suiteVersion: string;
  overallScore: number;
  dimensionScores: Record<string, number>;
  categoryScores: Record<string, number>;
  totalTurns: number;
  safetyFailures: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  promptTokens: number;
  completionTokens: number;
  costMicroUsd: number;
  humanRatings: number;
  selection: SelectionResult;
  completedAt: string | null;
}

export const benchmarkService = {
  /** Available suites without their cases, so the catalogue can be listed cheaply. */
  suites() {
    return listSuites().map((suite) => ({
      key: suiteKey(suite),
      id: suite.id,
      version: suite.version,
      description: suite.description,
      personas: suite.personas.length,
      cases: suite.cases.length,
      turns: suite.cases.reduce((total, item) => total + item.turns.length, 0),
      categories: [...new Set(suite.cases.map((item) => item.category))],
    }));
  },

  suiteDetail(key?: string) {
    const suite = getSuite(key);
    return {
      key: suiteKey(suite),
      id: suite.id,
      version: suite.version,
      description: suite.description,
      cases: suite.cases.map((item) => ({
        id: item.id,
        category: item.category,
        description: item.description,
        personaId: item.personaId,
        turns: item.turns.map((turn) => ({ id: turn.id, dimensions: turn.expectations.dimensions })),
      })),
    };
  },

  /** Declared candidates with configuration readiness. Secret values are never read out. */
  candidates() {
    return allCandidates().map((candidate) => {
      const state = readiness(candidate);
      return {
        id: candidate.id,
        label: candidate.label,
        kind: candidate.kind,
        model: candidate.model,
        notes: candidate.notes ?? null,
        ready: state.ready,
        missingConfig: state.missing,
        productionDefault: false,
      };
    });
  },

  async saveRun(result: BenchmarkRunResult): Promise<string> {
    const db = requireDb();
    const { summary } = result;

    return db.transaction(async (tx) => {
      const [run] = await tx
        .insert(benchmarkRuns)
        .values({
          suiteId: summary.suiteId,
          suiteVersion: summary.suiteVersion,
          candidateId: summary.candidateId,
          candidateLabel: summary.candidateLabel,
          provider: summary.provider,
          model: summary.model,
          moderation: summary.moderation,
          status: 'completed',
          overallScore: summary.overallScore,
          dimensionScores: summary.dimensionScores,
          categoryScores: summary.categoryScores,
          weights: summary.weights,
          totalTurns: summary.totalTurns,
          safetyFailures: summary.safetyFailures,
          blockedTurns: summary.blockedTurns,
          failedTurns: summary.failedTurns,
          promptTokens: summary.promptTokens,
          completionTokens: summary.completionTokens,
          costMicroUsd: summary.costMicroUsd,
          p50LatencyMs: summary.p50LatencyMs,
          p95LatencyMs: summary.p95LatencyMs,
          completedAt: new Date(),
        })
        .returning();

      if (result.turns.length > 0) {
        await tx.insert(benchmarkTurnResults).values(
          result.turns.map((turn) => ({
            runId: run.id,
            caseId: turn.caseId,
            turnId: turn.turnId,
            category: turn.category,
            sequence: turn.sequence,
            userMessage: turn.userMessage,
            responseText: turn.responseText,
            status: turn.status,
            errorCode: turn.errorCode,
            latencyMs: turn.latencyMs,
            promptTokens: turn.promptTokens,
            completionTokens: turn.completionTokens,
            costMicroUsd: turn.costMicroUsd,
            moderationFlags: turn.moderationFlags,
            safetyFailure: turn.safetyFailure,
            dimensionScores: turn.dimensionScores,
            trace: turn.trace,
          })),
        );
      }

      return run.id;
    });
  },

  /**
   * Records a human rating. Ratings are per rater, per turn, per criterion, and replace
   * that rater's previous value rather than accumulating duplicates.
   */
  async rateTurn(input: {
    turnResultId: string;
    raterUserId: string;
    criterion: string;
    score: number;
    comment?: string;
  }): Promise<void> {
    const db = requireDb();
    const [turn] = await db
      .select()
      .from(benchmarkTurnResults)
      .where(eq(benchmarkTurnResults.id, input.turnResultId))
      .limit(1);
    if (!turn) {
      throw HttpError.notFound('Benchmark turn not found', 'BENCHMARK_TURN_NOT_FOUND');
    }

    const values = {
      runId: turn.runId,
      turnResultId: input.turnResultId,
      raterUserId: input.raterUserId,
      criterion: input.criterion,
      score: input.score,
      comment: input.comment ?? null,
      updatedAt: new Date(),
    };

    await db
      .insert(benchmarkHumanRatings)
      .values(values)
      .onConflictDoUpdate({
        target: [
          benchmarkHumanRatings.turnResultId,
          benchmarkHumanRatings.raterUserId,
          benchmarkHumanRatings.criterion,
        ],
        set: { score: values.score, comment: values.comment, updatedAt: values.updatedAt },
      });
  },

  async humanSummary(runId: string): Promise<{ ratings: number; raters: number; score: number | null; byCriterion: Record<string, number> }> {
    const db = requireDb();
    const rows = await db.select().from(benchmarkHumanRatings).where(eq(benchmarkHumanRatings.runId, runId));
    if (rows.length === 0) return { ratings: 0, raters: 0, score: null, byCriterion: {} };

    const buckets = new Map<string, number[]>();
    for (const row of rows) {
      // A 1..5 rating becomes 0..1 so it composes with the automated scores.
      buckets.set(row.criterion, [...(buckets.get(row.criterion) ?? []), (row.score - 1) / 4]);
    }

    const byCriterion: Record<string, number> = {};
    for (const [criterion, scores] of buckets) {
      byCriterion[criterion] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    const values = Object.values(byCriterion);

    return {
      ratings: rows.length,
      raters: new Set(rows.map((row) => row.raterUserId)).size,
      score: values.reduce((a, b) => a + b, 0) / values.length,
      byCriterion,
    };
  },

  async listRuns(limit = 50) {
    const db = requireDb();
    return db.select().from(benchmarkRuns).orderBy(desc(benchmarkRuns.startedAt)).limit(limit);
  },

  async getRun(runId: string) {
    const db = requireDb();
    const [run] = await db.select().from(benchmarkRuns).where(eq(benchmarkRuns.id, runId)).limit(1);
    if (!run) {
      throw HttpError.notFound('Benchmark run not found', 'BENCHMARK_RUN_NOT_FOUND');
    }
    return run;
  },

  async getRunTurns(runId: string) {
    const db = requireDb();
    await this.getRun(runId);
    return db
      .select()
      .from(benchmarkTurnResults)
      .where(eq(benchmarkTurnResults.runId, runId))
      .orderBy(benchmarkTurnResults.sequence);
  },

  /**
   * Comparison table: the latest run per candidate for a suite, ranked by the Aura model
   * score. Disqualified candidates are ranked last regardless of how well they score.
   */
  async comparison(suiteId?: string): Promise<BenchmarkComparisonRow[]> {
    const db = requireDb();
    const rows = await db.select().from(benchmarkRuns).orderBy(desc(benchmarkRuns.startedAt));

    const latest = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (suiteId && row.suiteId !== suiteId) continue;
      const key = `${row.suiteId}@${row.suiteVersion}|${row.candidateId}`;
      if (!latest.has(key)) latest.set(key, row);
    }

    const built = await Promise.all(
      [...latest.values()].map(async (row) => {
        const human = await this.humanSummary(row.id);
        const dimensionScores = (row.dimensionScores ?? {}) as Record<string, number>;
        const selection = computeSelection({
          dimensionScores,
          totalTurns: row.totalTurns,
          costMicroUsd: row.costMicroUsd,
          safetyFailures: row.safetyFailures,
          failedTurns: row.failedTurns,
          humanScore: human.score,
        });

        return {
          candidateId: row.candidateId,
          candidateLabel: row.candidateLabel,
          provider: row.provider,
          model: row.model,
          suiteId: row.suiteId,
          suiteVersion: row.suiteVersion,
          overallScore: row.overallScore,
          dimensionScores,
          categoryScores: (row.categoryScores ?? {}) as Record<string, number>,
          totalTurns: row.totalTurns,
          safetyFailures: row.safetyFailures,
          p50LatencyMs: row.p50LatencyMs,
          p95LatencyMs: row.p95LatencyMs,
          promptTokens: row.promptTokens,
          completionTokens: row.completionTokens,
          costMicroUsd: row.costMicroUsd,
          humanRatings: human.ratings,
          selection,
          completedAt: row.completedAt ? row.completedAt.toISOString() : null,
        };
      }),
    );

    return built.sort((a, b) => {
      if (a.selection.disqualified !== b.selection.disqualified) return a.selection.disqualified ? 1 : -1;
      return b.selection.auraModelScore - a.selection.auraModelScore;
    });
  },
};

export type { BenchmarkRunSummary };
