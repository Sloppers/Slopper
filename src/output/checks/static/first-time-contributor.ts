import { Check, CheckContext } from '../check'
import { Indicators } from '../../label-factory'

export class FirstTimeContributorCheck extends Check {
  readonly label = Indicators.FIRST_TIME_CONTRIBUTOR
  readonly defaultWeight = 1

  evaluate(ctx: CheckContext): boolean {
    return ctx.firstTimeContributor
  }
}
