import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class RiskyUserCheck extends Check {
  readonly label = Labels.RISKY_USER.name
  readonly defaultWeight = 1

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.riskyUser
  }
}
