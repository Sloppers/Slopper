import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

export class LargeFileCheck extends Check {
  readonly label = Indicators.LARGE_FILE
  readonly defaultWeight = 1

  evaluate(ctx: CheckContext): boolean {
    if (ctx.rules.max_file_changes <= 0) return false
    return ctx.files.some(f => f.additions + f.deletions > ctx.rules.max_file_changes)
  }
}
