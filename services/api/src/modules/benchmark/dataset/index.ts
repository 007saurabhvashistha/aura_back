import type { BenchmarkSuite } from '../benchmark.types.js';
import { auraCharacterBenchmarkV1 } from './aura-character-benchmark-v1.js';

/** Suites are keyed by `id@version` so a run always names exactly what it measured. */
const SUITES: BenchmarkSuite[] = [auraCharacterBenchmarkV1];

export function suiteKey(suite: BenchmarkSuite): string {
  return `${suite.id}@${suite.version}`;
}

export function listSuites(): BenchmarkSuite[] {
  return SUITES;
}

export function getSuite(key?: string): BenchmarkSuite {
  if (!key) return auraCharacterBenchmarkV1;
  const found = SUITES.find((suite) => suiteKey(suite) === key || suite.id === key);
  if (!found) {
    throw new Error(`Unknown benchmark suite "${key}"`);
  }
  return found;
}

export { auraCharacterBenchmarkV1 };
