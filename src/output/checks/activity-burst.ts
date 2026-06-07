import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

export class ActivityBurstCheck extends Check {
  readonly label = Indicators.ACTIVITY_BURST
  readonly defaultWeight = 2

  evaluate(ctx: CheckContext): boolean {
    if (!ctx.authorProfile) return false
    const prs = ctx.authorProfile.prs_in_burst_window ?? ctx.authorProfile.prs_last_7d
    return prs > ctx.labelThresholds.activity_burst_prs
  }
}
