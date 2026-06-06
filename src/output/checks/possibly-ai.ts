import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class PossiblyAiCheck extends Check {
  readonly label = Labels.POSSIBLY_AI.name

  evaluate(ctx: CheckContext): boolean {
    if (!ctx.aiFingerprint) return false
    return ctx.aiFingerprint.score >= ctx.labelThresholds.ai_possibly
      && ctx.aiFingerprint.score < ctx.labelThresholds.ai_likely
  }
}
