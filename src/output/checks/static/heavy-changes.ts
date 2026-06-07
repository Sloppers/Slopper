import { Check, CheckContext } from '../check'
import { Indicators } from '../../label-factory'

export class HeavyChangesCheck extends Check {
  readonly label = Indicators.HEAVY_CHANGES
  readonly defaultWeight = 1

  evaluate(ctx: CheckContext): boolean {
    if (!ctx.prData || ctx.rules.max_total_changes <= 0) return false
    const total = ctx.prData.additions + ctx.prData.deletions
    return total > ctx.rules.max_total_changes
  }
}
