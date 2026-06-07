import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

export class RiskyUserCheck extends Check {
  readonly label = Indicators.RISKY_USER
  readonly defaultWeight = 1

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.riskyUser
  }
}
