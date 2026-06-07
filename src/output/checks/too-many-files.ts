import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

export class TooManyFilesCheck extends Check {
  readonly label = Indicators.TOO_MANY_FILES

  evaluate(ctx: CheckContext): boolean {
    return ctx.rules.max_files_changed > 0
      && !!ctx.prData
      && ctx.prData.changed_files_count > ctx.rules.max_files_changed
  }
}
