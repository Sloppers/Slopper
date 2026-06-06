import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class LargeFileCheck extends Check {
  readonly label = Labels.LARGE_FILE.name

  evaluate(ctx: CheckContext): boolean {
    if (ctx.rules.max_file_changes <= 0) return false
    return ctx.files.some(f => f.additions + f.deletions > ctx.rules.max_file_changes)
  }
}
