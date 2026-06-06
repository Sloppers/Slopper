# Refactor deterministic scoring into a Signal class framework

## Context

The deterministic score is computed in a monolithic static method (`LabelComputer.computeDeterministicScore()`) with all signals hardcoded. Adding a new signal means editing the function, updating the weights interface, updating the config parser, and updating defaults in multiple places. The user wants a clean class-based system where each signal is a class that extends a base, making it trivial to add or modify signals.

## Design

### New file: `src/core/signals.ts`

Abstract base class + built-in signals + engine:

```typescript
// Context bag passed to every signal
export interface SignalContext {
  authorProfile?: AuthorProfileAnalysis
  aiFingerprint?: AiFingerprintResult
  riskyUser?: boolean
  trustedOrg?: boolean
}

// Each signal returns a factor (0–1 for proportional, or 0/1 for boolean)
// The engine multiplies factor × weight to get points
export abstract class Signal {
  abstract readonly key: string
  abstract readonly defaultWeight: number
  abstract evaluate(ctx: SignalContext): number
}

// Built-in signals
export class FingerprintSignal extends Signal { key='fingerprint'; defaultWeight=4; ... }
export class SpraySignal extends Signal { key='spray'; defaultWeight=3; ... }
export class NewAccountSignal extends Signal { key='new_account'; defaultWeight=1; ... }
export class LowMergeRatioSignal extends Signal { key='low_merge_ratio'; defaultWeight=1; ... }
export class RiskyUserSignal extends Signal { key='risky_user'; defaultWeight=1; ... }
export class TrustedOrgSignal extends Signal { key='trusted_org'; defaultWeight=-2; ... }

// Engine runs all signals, sums weighted results, clamps to [0, 10]
export class SignalEngine {
  private readonly signals: Signal[]

  constructor(signals?: Signal[]) {
    this.signals = signals ?? SignalEngine.defaultSignals()
  }

  static defaultSignals(): Signal[] {
    return [
      new FingerprintSignal(),
      new SpraySignal(),
      new NewAccountSignal(),
      new LowMergeRatioSignal(),
      new RiskyUserSignal(),
      new TrustedOrgSignal()
    ]
  }

  compute(ctx: SignalContext, weights?: Record<string, number>): { score: number; breakdown: SignalResult[] } {
    const breakdown: SignalResult[] = []
    let total = 0
    for (const signal of this.signals) {
      const weight = weights?.[signal.key] ?? signal.defaultWeight
      const factor = signal.evaluate(ctx)
      const points = factor * weight
      total += points
      breakdown.push({ key: signal.key, factor, weight, points })
    }
    const score = Math.max(0, Math.min(10, Math.round(total * 10) / 10))
    return { score, breakdown }
  }
}

export interface SignalResult {
  key: string
  factor: number
  weight: number
  points: number
}
```

### Changes to existing files

**`src/core/config.ts`** — `ScoreWeightsConfig` stays as-is (it's already a `Record`-like shape matching signal keys). No change needed.

**`src/output/labels.ts`** — Replace `computeDeterministicScore()` static method with a call to `SignalEngine.compute()`. The `LabelComputer` constructor creates a `SignalEngine` instance. The method becomes a thin wrapper:

```typescript
static computeDeterministicScore(opts: {
  authorProfile?: AuthorProfileAnalysis
  aiFingerprint?: AiFingerprintResult
  riskyUser?: boolean
  trustedOrg?: boolean
  weights?: ScoreWeightsConfig
}): number {
  const engine = new SignalEngine()
  const { score } = engine.compute(
    { authorProfile: opts.authorProfile, aiFingerprint: opts.aiFingerprint, riskyUser: opts.riskyUser, trustedOrg: opts.trustedOrg },
    opts.weights as Record<string, number> | undefined
  )
  return score
}
```

**`src/output/commenter.ts`** — Add breakdown to the deterministic comment. When `SignalResult[]` is available, show which signals contributed and how many points each added. Add `breakdown` to `CommentOptions`.

**`src/steps/09_compute-labels.ts`** — Use `SignalEngine` to compute the score and store the breakdown in context.

**`src/core/pipeline.ts`** — Add `signalBreakdown?: SignalResult[]` to `PipelineContext`.

**`src/steps/10_post-results.ts`** — Pass breakdown to comment builder.

### Files to create/modify

- **Create**: `src/core/signals.ts`
- **Modify**: `src/output/labels.ts`, `src/output/commenter.ts`, `src/steps/09_compute-labels.ts`, `src/steps/10_post-results.ts`, `src/core/pipeline.ts`
- **Tests**: Update `__tests__/labels.test.ts` to test `SignalEngine` directly

### How to add a new signal after this refactor

1. Create a class extending `Signal` in `signals.ts` (or a separate file)
2. Add its key to `ScoreWeightsConfig` in `config.ts`
3. Add default weight in config defaults
4. Add the field to `SignalContext` if it needs new data
5. Register it in `SignalEngine.defaultSignals()`

That's it — no touching the scoring logic, labels, or commenter.

## Verification

1. `npm run build --no-workspaces` — clean compile
2. `npm run test --no-workspaces` — all tests pass
3. Default signals produce identical scores to the current hardcoded implementation
