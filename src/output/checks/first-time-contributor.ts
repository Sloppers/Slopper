import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class FirstTimeContributorCheck extends Check {
  readonly label = Labels.FIRST_TIME_CONTRIBUTOR.name

  evaluate(ctx: CheckContext): boolean {
    return ctx.firstTimeContributor
  }
}
