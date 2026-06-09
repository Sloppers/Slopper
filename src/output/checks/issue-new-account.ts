import { IssueCheckDef } from './issue-check'
import { Indicators } from '../label-factory'

export const issueNewAccount: IssueCheckDef = {
  label: Indicators.NEW_ACCOUNT,
  weight: 1,
  evaluate: ctx => !!ctx.authorProfile && ctx.authorProfile.account_age_days < ctx.labelThresholds.new_account_days
}
