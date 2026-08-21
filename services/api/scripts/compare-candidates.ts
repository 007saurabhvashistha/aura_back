import { createCompanionEngine } from '../src/modules/companion/companion.engine.js';
import { LlmGateway } from '../src/providers/llm/llm.gateway.js';
import { runBenchmark } from '../src/modules/benchmark/benchmark.runner.js';
import { benchmarkService } from '../src/modules/benchmark/benchmark.service.js';
import { computeSelection, SELECTION_WEIGHTS } from '../src/modules/benchmark/benchmark.selection.js';
import {
  allCandidates,
  createCandidateProvider,
  readiness,
  type ModelCandidate,
} from '../src/modules/benchmark/candidates.js';
import { getSuite } from '../src/modules/benchmark/dataset/index.js';
import type { BenchmarkRunResult } from '../src/modules/benchmark/benchmark.types.js';

/**
 * Evaluation harness for Phase 4J. Running a candidate here NEVER makes it the production
 * provider; `LLM_PROVIDER` is untouched by this script.
 *
 * Usage:
 *   npm run benchmark:candidates                       # readiness table
 *   npm run benchmark:compare                          # every ready candidate
 *   npm run benchmark:compare -- --only a,b            # a subset
 *   npm run benchmark:compare -- --include-scripted    # add synthetic bounds
 *   npm run benchmark:compare -- --no-save
 */

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function pct(value: number | null | undefined): string {
  return value === null || value === undefined ? '    — ' : `${(value * 100).toFixed(1).padStart(5)}%`;
}

function printReadiness(): void {
  console.log('\nDeclared candidates\n');
  for (const candidate of allCandidates()) {
    const state = readiness(candidate);
    const status = state.ready ? 'READY     ' : `NOT READY `;
    const detail = state.ready ? '' : `missing ${state.missing.join(', ') || 'base URL'}`;
    console.log(`  ${status} ${candidate.id.padEnd(30)} ${candidate.label}`);
    if (detail) console.log(`             ${detail}`);
  }
  console.log('\nNo candidate is the production provider. LLM_PROVIDER remains unchanged.\n');
}

function selectFor(candidates: ModelCandidate[]): ModelCandidate[] {
  const only = arg('only');
  const filtered = only
    ? candidates.filter((candidate) => only.split(',').map((item) => item.trim()).includes(candidate.id))
    : candidates.filter((candidate) => candidate.kind !== 'scripted' || flag('include-scripted'));

  return filtered.filter((candidate) => {
    const state = readiness(candidate);
    if (!state.ready) {
      console.log(`  skipping ${candidate.id} — missing ${state.missing.join(', ') || 'base URL'}`);
    }
    return state.ready;
  });
}

async function main(): Promise<void> {
  if (flag('list')) {
    printReadiness();
    return;
  }

  const suite = getSuite(arg('suite'));
  const candidates = selectFor(allCandidates());

  if (candidates.length === 0) {
    console.log('\nNo configured candidates. Run with --list to see what is missing.\n');
    return;
  }

  console.log(`\nAura Character Benchmark — ${suite.id}@${suite.version}`);
  console.log(`candidates: ${candidates.map((candidate) => candidate.id).join(', ')}\n`);

  const results: Array<{ candidate: ModelCandidate; result: BenchmarkRunResult }> = [];

  for (const candidate of candidates) {
    process.stdout.write(`  running ${candidate.id} ... `);
    const engine = createCompanionEngine(new LlmGateway(createCandidateProvider(candidate)));
    try {
      const result = await runBenchmark(suite, engine, { id: candidate.id, label: candidate.label });
      results.push({ candidate, result });
      console.log(`done (${result.summary.totalTurns} turns)`);
      if (!flag('no-save')) {
        await benchmarkService.saveRun(result);
      }
    } catch (error) {
      console.log(`FAILED — ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  if (results.length === 0) return;

  const ranked = results
    .map(({ candidate, result }) => ({
      candidate,
      summary: result.summary,
      selection: computeSelection({
        dimensionScores: result.summary.dimensionScores,
        totalTurns: result.summary.totalTurns,
        costMicroUsd: result.summary.costMicroUsd,
        safetyFailures: result.summary.safetyFailures,
        failedTurns: result.summary.failedTurns,
      }),
    }))
    .sort((a, b) => {
      if (a.selection.disqualified !== b.selection.disqualified) return a.selection.disqualified ? 1 : -1;
      return b.selection.auraModelScore - a.selection.auraModelScore;
    });

  console.log('\nBenchmark score (8-dimension rubric, unchanged baseline)\n');
  console.log(`  ${'candidate'.padEnd(30)} ${'overall'.padStart(8)} ${'char'.padStart(7)} ${'natural'.padStart(8)} ${'emo'.padStart(7)} ${'rel'.padStart(7)} ${'mem'.padStart(7)} ${'lang'.padStart(7)} ${'safety'.padStart(7)}`);
  for (const { candidate, summary } of ranked) {
    const d = summary.dimensionScores;
    console.log(
      `  ${candidate.id.padEnd(30)} ${(summary.overallScore / 100).toFixed(2).padStart(8)} ${pct(d.character_consistency)} ${pct(d.naturalness)} ${pct(d.emotional_intelligence)} ${pct(d.relationship_continuity)} ${pct(d.memory_recall)} ${pct(d.language_fidelity)} ${pct(d.safety)}`,
    );
  }

  console.log('\nSelection score (product weights, layered on top)\n');
  console.log(`  weights: ${Object.entries(SELECTION_WEIGHTS).map(([key, value]) => `${key} ${value}%`).join(', ')}`);
  console.log(`  safety is a GATE, not a weight\n`);
  console.log(`  ${'candidate'.padEnd(30)} ${'aura score'.padStart(11)} ${'p95'.padStart(8)} ${'cost/turn'.padStart(11)} ${'safety fails'.padStart(13)}  status`);
  for (const { candidate, summary, selection } of ranked) {
    const perTurn = summary.totalTurns === 0 ? 0 : summary.costMicroUsd / summary.totalTurns / 1_000_000;
    const status = selection.disqualified ? `DISQUALIFIED — ${selection.disqualificationReason}` : 'eligible';
    console.log(
      `  ${candidate.id.padEnd(30)} ${(selection.auraModelScore / 100).toFixed(2).padStart(11)} ${`${summary.p95LatencyMs}ms`.padStart(8)} ${`$${perTurn.toFixed(6)}`.padStart(11)} ${String(summary.safetyFailures).padStart(13)}  ${status}`,
    );
  }
  const eligible = ranked.filter((row) => !row.selection.disqualified);
  console.log(
    `\nLeader: ${eligible.length > 0 ? eligible[0].candidate.label : 'none — every candidate was disqualified'}`,
  );
  console.log('This is evaluation only. No candidate has been promoted to the production provider.\n');
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
