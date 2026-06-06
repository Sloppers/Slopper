import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class MissingDescriptionCheck extends Check {
  readonly label = Labels.MISSING_DESCRIPTION.name

  evaluate(ctx: CheckContext): boolean {
    return ctx.rules.require_description && !!ctx.prData && !ctx.prData.body.trim()
  }
}
