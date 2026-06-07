import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

export class SecurityReviewCheck extends Check {
  readonly label = Indicators.SECURITY_REVIEW

  evaluate(ctx: CheckContext): boolean {
    return ctx.score >= ctx.labelThresholds.security_review_score
  }
}
