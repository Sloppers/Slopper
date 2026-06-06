import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class ApprovedCheck extends Check {
  readonly label = Labels.APPROVED.name

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.analysis && ctx.score <= ctx.thresholds.low && ctx.analysis.confidence === 'high'
  }
}
