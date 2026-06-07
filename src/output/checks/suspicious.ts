import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

export class SuspiciousCheck extends Check {
  readonly label = Indicators.SUSPICIOUS

  evaluate(ctx: CheckContext): boolean {
    return ctx.score >= ctx.labelThresholds.suspicious_score
  }
}
