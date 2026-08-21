/**
 * Runs the Aura Character Benchmark against the currently configured provider.
 *
 * Usage:
 *   npm run benchmark                       # run + persist
 *   npm run benchmark -- --suite <key>      # pick a suite
 *   npm run benchmark -- --no-save          # print only, write nothing
 *
 * The provider is whatever LLM_PROVIDER resolves to. No vendor is registered by default,
 * so this baselines DemoLLMProvider.
 */
import { createCompanionEngine } from '../src/modules/companion/companion.engine.js';
import { runBenchmark } from '../src/modules/benchmark/benchmark.runner.js';
import { benchmarkService } from '../src/modules/benchmark/benchmark.service.js';
import { getSuite } from '../src/modules/benchmark/dataset/index.js';
function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function pct(value: number | undefined): string {
  return value === undefined ? '   — ' : `${(value * 100).toFixed(1).padStart(5)}%`;
}

async function main(): Promise<void> {
  const suite = getSuite(arg('suite'));
  const engine = createCompanionEngine();
  const status = engine.status();

  console.log(`\nAura Character Benchmark — ${suite.id}@${suite.version}`);
  console.log(`provider=${status.provider} model=${status.model} moderation=${status.moderation}\n`);

  const result = await runBenchmark(suite, engine, {
    id: `configured:${status.provider}`,
    label: `Configured provider (${status.provider}:${status.model})`,
  });
  const { summary } = result;

  console.log('Dimension scores');
  for (const [dimension, weight] of Object.entries(summary.weights)) {
    const score = summary.dimensionScores[dimension as keyof typeof summary.dimensionScores];
    console.log(`  ${dimension.padEnd(24)} ${pct(score)}   (weight ${weight}%)`);
  }

  console.log('\nCategory scores');
  for (const [category, score] of Object.entries(summary.categoryScores)) {
    console.log(`  ${category.padEnd(24)} ${pct(score)}`);
  }

  console.log('\nSummary');
  console.log(`  overall              ${(summary.overallScore / 100).toFixed(2)} / 100`);
  console.log(`  turns                ${summary.totalTurns}`);
  console.log(`  blocked / failed     ${summary.blockedTurns} / ${summary.failedTurns}`);
  console.log(`  safety failures      ${summary.safetyFailures}`);
  console.log(`  tokens (in/out)      ${summary.promptTokens} / ${summary.completionTokens}`);
  console.log(`  cost                 $${(summary.costMicroUsd / 1_000_000).toFixed(6)}`);
  console.log(`  latency p50 / p95    ${summary.p50LatencyMs}ms / ${summary.p95LatencyMs}ms`);

  if (summary.safetyFailures > 0) {
    console.log('\nSafety failures');
    for (const turn of result.turns.filter((item) => item.safetyFailure)) {
      console.log(`  [${turn.category}] ${turn.caseId}/${turn.turnId}`);
    }
  }

  if (process.argv.includes('--no-save')) {
    console.log('\nNot saved (--no-save).\n');
    return;
  }

  const runId = await benchmarkService.saveRun(result);
  console.log(`\nSaved run ${runId}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
