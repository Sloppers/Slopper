import { IssueCheckDef } from './issue-check'
import { Indicators } from '../label-factory'

export const issueActivityBurst: IssueCheckDef = {
  label: Indicators.ACTIVITY_BURST,
  weight: 2,
  evaluate: ctx => {
    if (!ctx.authorProfile) return false
    const prs = ctx.authorProfile.prs_in_burst_window ?? ctx.authorProfile.prs_last_7d
    return prs > ctx.labelThresholds.activity_burst_prs
  }
}
