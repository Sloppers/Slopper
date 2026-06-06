import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class LikelyAiCheck extends Check {
  readonly label = Labels.LIKELY_AI.name

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.aiFingerprint && ctx.aiFingerprint.score >= ctx.labelThresholds.ai_likely
  }
}
