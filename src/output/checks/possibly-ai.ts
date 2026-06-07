import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

export class PossiblyAiCheck extends Check {
  readonly label = Indicators.POSSIBLY_AI

  evaluate(ctx: CheckContext): boolean {
    if (!ctx.aiFingerprint) return false
    return ctx.aiFingerprint.score >= ctx.labelThresholds.ai_possibly
      && ctx.aiFingerprint.score < ctx.labelThresholds.ai_likely
  }
}
