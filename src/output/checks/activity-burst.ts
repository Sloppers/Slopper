import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class ActivityBurstCheck extends Check {
  readonly label = Labels.ACTIVITY_BURST.name

  evaluate(ctx: CheckContext): boolean {
    if (!ctx.authorProfile) return false
    const prs = ctx.authorProfile.prs_in_burst_window ?? ctx.authorProfile.prs_last_7d
    return prs > ctx.labelThresholds.activity_burst_prs
  }
}
