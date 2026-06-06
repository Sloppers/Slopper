import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class SuspiciousCheck extends Check {
  readonly label = Labels.SUSPICIOUS.name

  evaluate(ctx: CheckContext): boolean {
    return ctx.score >= ctx.labelThresholds.suspicious_score
  }
}
