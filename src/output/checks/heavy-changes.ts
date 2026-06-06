import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class HeavyChangesCheck extends Check {
  readonly label = Labels.HEAVY_CHANGES.name

  evaluate(ctx: CheckContext): boolean {
    if (!ctx.prData || ctx.rules.max_total_changes <= 0) return false
    const total = ctx.prData.additions + ctx.prData.deletions
    return total > ctx.rules.max_total_changes
  }
}
