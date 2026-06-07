import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

export class MissingDescriptionCheck extends Check {
  readonly label = Indicators.MISSING_DESCRIPTION

  evaluate(ctx: CheckContext): boolean {
    return ctx.rules.require_description && !!ctx.prData && !ctx.prData.body.trim()
  }
}
