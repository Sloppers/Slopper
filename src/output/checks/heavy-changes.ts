import { CheckDef } from './check'
import { Indicators } from '../label-factory'

export const heavyChanges: CheckDef = {
  label: Indicators.HEAVY_CHANGES,
  weight: 1,
  evaluate: ctx => {
    if (!ctx.prData || ctx.rules.max_total_changes <= 0) return false
    return ctx.prData.additions + ctx.prData.deletions > ctx.rules.max_total_changes
  }
}
