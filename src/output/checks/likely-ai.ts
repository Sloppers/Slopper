import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class LikelyAiCheck extends Check {
  readonly label = Labels.LIKELY_AI.name
  readonly defaultWeight = 4

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.aiFingerprint && ctx.aiFingerprint.score >= ctx.labelThresholds.ai_likely
  }

  scoreFactor(ctx: CheckContext): number {
    return ctx.aiFingerprint ? ctx.aiFingerprint.score / 100 : 0
  }
}
