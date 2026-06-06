import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class SecurityReviewCheck extends Check {
  readonly label = Labels.SECURITY_REVIEW.name

  evaluate(ctx: CheckContext): boolean {
    return ctx.score >= ctx.labelThresholds.security_review_score
  }
}
