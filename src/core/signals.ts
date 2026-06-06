import { AuthorProfileAnalysis, AiFingerprintResult } from './types'

export interface SignalContext {
  authorProfile?: AuthorProfileAnalysis
  aiFingerprint?: AiFingerprintResult
  riskyUser?: boolean
  trustedOrg?: boolean
}

export interface SignalResult {
  key: string
  factor: number
  weight: number
  points: number
}

export abstract class Signal {
  abstract readonly key: string
  abstract readonly defaultWeight: number
  abstract evaluate(ctx: SignalContext): number
}

export class FingerprintSignal extends Signal {
  readonly key = 'fingerprint'
  readonly defaultWeight = 4

  evaluate(ctx: SignalContext): number {
    return ctx.aiFingerprint ? ctx.aiFingerprint.score / 100 : 0
  }
}

export class SpraySignal extends Signal {
  readonly key = 'spray'
  readonly defaultWeight = 3

  evaluate(ctx: SignalContext): number {
    return ctx.authorProfile ? ctx.authorProfile.spray_score / 100 : 0
  }
}

export class NewAccountSignal extends Signal {
  readonly key = 'new_account'
  readonly defaultWeight = 1

  evaluate(ctx: SignalContext): number {
    return ctx.authorProfile && ctx.authorProfile.account_age_days < 30 ? 1 : 0
  }
}

export class LowMergeRatioSignal extends Signal {
  readonly key = 'low_merge_ratio'
  readonly defaultWeight = 1

  evaluate(ctx: SignalContext): number {
    return ctx.authorProfile && ctx.authorProfile.merge_ratio < 0.4 ? 1 : 0
  }
}

export class RiskyUserSignal extends Signal {
  readonly key = 'risky_user'
  readonly defaultWeight = 1

  evaluate(ctx: SignalContext): number {
    return ctx.riskyUser ? 1 : 0
  }
}

export class TrustedOrgSignal extends Signal {
  readonly key = 'trusted_org'
  readonly defaultWeight = -2

  evaluate(ctx: SignalContext): number {
    return ctx.trustedOrg ? 1 : 0
  }
}

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
