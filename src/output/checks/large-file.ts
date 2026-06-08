import { CheckDef } from './check'
import { Indicators } from '../label-factory'

export const largeFile: CheckDef = {
  label: Indicators.LARGE_FILE,
  weight: 1,
  evaluate: ctx => {
    if (ctx.rules.max_file_changes <= 0) return false
    return ctx.files.some(f => f.additions + f.deletions > ctx.rules.max_file_changes)
  }
}
