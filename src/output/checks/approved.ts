import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

export class ApprovedCheck extends Check {
  readonly label = Indicators.APPROVED

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.analysis && ctx.score <= ctx.thresholds.low && ctx.analysis.confidence === 'high'
  }
}
