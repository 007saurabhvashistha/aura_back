import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLlmProvider } from '../src/providers/llm/llm.provider.js';
import { OpenAICompatibleProvider } from '../src/providers/llm/evaluation/openai-compatible.provider.js';
import { ScriptedProvider } from '../src/providers/llm/evaluation/scripted.provider.js';
import { LlmGateway } from '../src/providers/llm/llm.gateway.js';
import { createCompanionEngine } from '../src/modules/companion/companion.engine.js';
import { runBenchmark } from '../src/modules/benchmark/benchmark.runner.js';
import {
  computeSelection,
  HUMAN_WEIGHT,
  SELECTION_WEIGHTS,
  __testing as selectionTesting,
} from '../src/modules/benchmark/benchmark.selection.js';
import {
  allCandidates,
  createCandidateProvider,
  getCandidate,
  readiness,
} from '../src/modules/benchmark/candidates.js';
import { auraCharacterBenchmarkV1 } from '../src/modules/benchmark/dataset/index.js';

const BASE_DIMENSIONS = {
  naturalness: 0.9,
  character_consistency: 0.9,
  emotional_intelligence: 0.8,
  relationship_continuity: 0.8,
  memory_recall: 0.6,
  language_fidelity: 0.7,
  latency: 1,
  safety: 1,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('production provider isolation', () => {
  it('never resolves an evaluation candidate as the production provider', () => {
    expect(createLlmProvider('demo').name).toBe('demo');
    expect(createLlmProvider('none').name).toBe('none');

    // Every declared candidate id must be unusable as a production provider.
    for (const candidate of allCandidates()) {
      if (candidate.id === 'demo-baseline') continue;
      expect(createLlmProvider(candidate.id).name).toBe('none');
    }
    expect(createLlmProvider('openai_compatible').name).toBe('none');
    expect(createLlmProvider('scripted').name).toBe('none');
  });

  it('refuses to build an unconfigured candidate rather than silently degrading', () => {
    const candidate = getCandidate('qwen2.5-72b-instruct');
    expect(readiness(candidate).ready).toBe(false);
    expect(() => createCandidateProvider(candidate)).toThrow(/not configured/i);
  });

  it('reports readiness from presence without exposing secret values', () => {
    vi.stubEnv('EVAL_QWEN_BASE_URL', 'https://example.invalid/v1');
    vi.stubEnv('EVAL_QWEN_API_KEY', 'super-secret-value');

    const state = readiness(getCandidate('qwen2.5-72b-instruct'));
    expect(state.ready).toBe(true);
    expect(state.missing).toEqual([]);
    expect(JSON.stringify(state)).not.toContain('super-secret-value');
  });

  it('marks a local runtime ready without an API key', () => {
    const state = readiness(getCandidate('local-openai-compatible'));
    expect(state.ready).toBe(true);
    expect(state.baseUrl).toContain('http');
  });
});

describe('openai-compatible evaluation adapter', () => {
  const input = { systemPrompt: 'You are Maya.', messages: [{ role: 'user', content: 'hey' }] };

  it('sends an OpenAI chat-completions request and maps usage back', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'I am here.' } }],
          usage: { prompt_tokens: 42, completion_tokens: 7 },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('EVAL_TEST_KEY', 'secret-key');

    const provider = new OpenAICompatibleProvider(
      {
        baseUrl: 'https://example.invalid/v1',
        model: 'Qwen/Qwen2.5-72B-Instruct',
        apiKeyEnv: 'EVAL_TEST_KEY',
        costPer1kInputMicroUsd: 1000,
        costPer1kOutputMicroUsd: 2000,
      },
      'qwen',
    );

    const result = await provider.complete(input);

    expect(result.text).toBe('I am here.');
    expect(result.promptTokens).toBe(42);
    expect(result.completionTokens).toBe(7);
    expect(result.estimatedCostUsd).toBeCloseTo((1000 * 42) / 1000 / 1e6 + (2000 * 7) / 1000 / 1e6, 12);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.invalid/v1/chat/completions');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer secret-key');

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('Qwen/Qwen2.5-72B-Instruct');
    expect(body.messages[0]).toEqual({ role: 'system', content: 'You are Maya.' });
    expect(body.temperature).toBe(0);
  });

  it('omits the authorization header when no key is configured', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await new OpenAICompatibleProvider({ baseUrl: 'http://localhost:11434/v1', model: 'local' }).complete(input);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).authorization).toBeUndefined();
  });

  it('does not leak an upstream error body into the thrown message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('user said: my private secret', { status: 500, statusText: 'Server Error' })),
    );

    const provider = new OpenAICompatibleProvider({ baseUrl: 'https://example.invalid/v1', model: 'm' });
    await expect(provider.complete(input)).rejects.toThrow('Provider responded 500 Server Error');
    await expect(provider.complete(input)).rejects.not.toThrow(/private secret/);
  });

  it('parses a server-sent-event stream into deltas', async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"I am"}}]}\n',
      'data: {"choices":[{"delta":{"content":" here."}}],"usage":{"prompt_tokens":5,"completion_tokens":3}}\n',
      'data: [DONE]\n',
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(stream, { status: 200 })));

    const deltas: string[] = [];
    const result = await new OpenAICompatibleProvider({
      baseUrl: 'https://example.invalid/v1',
      model: 'm',
    }).stream(input, (delta) => deltas.push(delta));

    expect(deltas).toEqual(['I am', ' here.']);
    expect(result.text).toBe('I am here.');
    expect(result.promptTokens).toBe(5);
  });
});

describe('scripted evaluation adapter', () => {
  it('replays the first matching rule and is deterministic', async () => {
    const provider = new ScriptedProvider({
      model: 'scripted-1',
      fallback: 'fallback reply',
      rules: [{ match: /family/i, reply: 'Your sister Ira.' }],
    });

    const request = { systemPrompt: 's', messages: [{ role: 'user', content: 'tell me about my family' }] };
    const [first, second] = await Promise.all([provider.complete(request), provider.complete(request)]);

    expect(first.text).toBe('Your sister Ira.');
    expect(second.text).toBe(first.text);

    const other = await provider.complete({ systemPrompt: 's', messages: [{ role: 'user', content: 'hi' }] });
    expect(other.text).toBe('fallback reply');
  });
});

describe('selection score', () => {
  it('uses product weights that sum to 100 and leaves safety out of them', () => {
    expect(Object.values(SELECTION_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
    expect(Object.keys(SELECTION_WEIGHTS)).not.toContain('safety');
  });

  it('does not alter the underlying benchmark dimensions', () => {
    const dimensions = { ...BASE_DIMENSIONS };
    computeSelection({ dimensionScores: dimensions, totalTurns: 10, costMicroUsd: 0, safetyFailures: 0 });
    expect(dimensions).toEqual(BASE_DIMENSIONS);
  });

  it('averages relationship continuity and memory recall into one criterion', () => {
    const result = computeSelection({
      dimensionScores: { relationship_continuity: 1, memory_recall: 0 },
      totalTurns: 1,
      costMicroUsd: 0,
      safetyFailures: 0,
    });
    expect(result.criteria.relationship_and_memory).toBe(0.5);
  });

  it('disqualifies any candidate with a safety failure regardless of score', () => {
    const perfect = computeSelection({
      dimensionScores: { ...BASE_DIMENSIONS, naturalness: 1, character_consistency: 1 },
      totalTurns: 10,
      costMicroUsd: 0,
      safetyFailures: 1,
    });
    expect(perfect.disqualified).toBe(true);
    expect(perfect.disqualificationReason).toMatch(/safety failure/i);
    expect(perfect.auraModelScore).toBeGreaterThan(0);
  });

  it('scores cost per turn against the budget', () => {
    expect(selectionTesting.costScore(0, 10)).toBe(1);
    expect(selectionTesting.costScore(20_000, 10)).toBe(1);
    expect(selectionTesting.costScore(80_000, 10)).toBe(0);
    expect(selectionTesting.costScore(0, 0)).toBeNull();
  });

  it('disqualifies a candidate whose turns mostly failed instead of ranking it', () => {
    const unreachable = computeSelection({
      dimensionScores: { naturalness: 0, character_consistency: 0 },
      totalTurns: 19,
      costMicroUsd: 0,
      safetyFailures: 0,
      failedTurns: 19,
    });
    expect(unreachable.unusable).toBe(true);
    expect(unreachable.disqualified).toBe(true);
    expect(unreachable.disqualificationReason).toMatch(/not a usable measurement/i);
  });

  it('tolerates a small number of failed turns', () => {
    const mostlyFine = computeSelection({
      dimensionScores: BASE_DIMENSIONS,
      totalTurns: 20,
      costMicroUsd: 0,
      safetyFailures: 0,
      failedTurns: 2,
    });
    expect(mostlyFine.unusable).toBe(false);
    expect(mostlyFine.disqualified).toBe(false);
  });

  it('blends a human panel score only when ratings exist', () => {
    const base = { dimensionScores: BASE_DIMENSIONS, totalTurns: 10, costMicroUsd: 0, safetyFailures: 0 };
    const automatedOnly = computeSelection(base);
    expect(automatedOnly.humanScore).toBeNull();
    expect(automatedOnly.auraModelScore).toBe(automatedOnly.automatedScore);

    const withHuman = computeSelection({ ...base, humanScore: 0.2 });
    const expected = Math.round(
      ((automatedOnly.automatedScore / 10_000) * (1 - HUMAN_WEIGHT) + 0.2 * HUMAN_WEIGHT) * 10_000,
    );
    expect(withHuman.auraModelScore).toBe(expected);
    expect(withHuman.auraModelScore).toBeLessThan(automatedOnly.auraModelScore);
  });

  it('ignores criteria that were never exercised instead of scoring them zero', () => {
    const partial = computeSelection({
      dimensionScores: { naturalness: 1 },
      totalTurns: 0,
      costMicroUsd: 0,
      safetyFailures: 0,
    });
    expect(partial.criteria.language_fidelity).toBeNull();
    expect(partial.criteria.cost).toBeNull();
    expect(partial.automatedScore).toBe(10_000);
  });
});

describe('candidate comparison end to end', () => {
  async function run(candidateId: string) {
    const candidate = getCandidate(candidateId);
    const engine = createCompanionEngine(new LlmGateway(createCandidateProvider(candidate)));
    const result = await runBenchmark(auraCharacterBenchmarkV1, engine, {
      id: candidate.id,
      label: candidate.label,
    });
    return {
      summary: result.summary,
      selection: computeSelection({
        dimensionScores: result.summary.dimensionScores,
        totalTurns: result.summary.totalTurns,
        costMicroUsd: result.summary.costMicroUsd,
        safetyFailures: result.summary.safetyFailures,
        failedTurns: result.summary.failedTurns,
      }),
    };
  }

  it('records which candidate a run measured', async () => {
    const { summary } = await run('demo-baseline');
    expect(summary.candidateId).toBe('demo-baseline');
    expect(summary.candidateLabel).toContain('Demo');
  });

  it('ranks a strong candidate above the demo baseline on the selection score', async () => {
    const [strong, baseline] = await Promise.all([run('scripted-strong'), run('demo-baseline')]);

    expect(strong.selection.disqualified).toBe(false);
    expect(strong.selection.auraModelScore).toBeGreaterThan(baseline.selection.auraModelScore);
    expect(strong.summary.dimensionScores.memory_recall ?? 0).toBeGreaterThan(
      baseline.summary.dimensionScores.memory_recall ?? 0,
    );
    expect(strong.summary.dimensionScores.language_fidelity ?? 0).toBeGreaterThan(
      baseline.summary.dimensionScores.language_fidelity ?? 0,
    );
  });

  it('disqualifies a candidate that complies with requests Aura must refuse', async () => {
    const weak = await run('scripted-weak');
    expect(weak.summary.safetyFailures).toBeGreaterThan(0);
    expect(weak.selection.disqualified).toBe(true);
  });

  it('keeps every candidate on identical context so the comparison is apples to apples', async () => {
    const [first, second] = await Promise.all([run('scripted-strong'), run('scripted-strong')]);
    expect(second.summary.dimensionScores).toEqual(first.summary.dimensionScores);
    expect(second.summary.totalTurns).toBe(first.summary.totalTurns);
  });
});
