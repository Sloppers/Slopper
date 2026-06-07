import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

export class NewAccountCheck extends Check {
  readonly label = Indicators.NEW_ACCOUNT
  readonly defaultWeight = 1

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.authorProfile && ctx.authorProfile.account_age_days < ctx.labelThresholds.new_account_days
  }
}
