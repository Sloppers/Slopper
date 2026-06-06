import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class NewAccountCheck extends Check {
  readonly label = Labels.NEW_ACCOUNT.name

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.authorProfile && ctx.authorProfile.account_age_days < ctx.labelThresholds.new_account_days
  }
}
