import { CheckDef } from './check'
import { Indicators } from '../label-factory'

export const newAccount: CheckDef = {
  label: Indicators.NEW_ACCOUNT,
  weight: 1,
  evaluate: ctx => !!ctx.authorProfile && ctx.authorProfile.account_age_days < ctx.labelThresholds.new_account_days
}
