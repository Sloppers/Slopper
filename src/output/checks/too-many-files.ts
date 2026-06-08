import { CheckDef } from './check'
import { Indicators } from '../label-factory'

export const tooManyFiles: CheckDef = {
  label: Indicators.TOO_MANY_FILES,
  weight: 1,
  evaluate: ctx => ctx.rules.max_files_changed > 0 && !!ctx.prData && ctx.prData.changed_files_count > ctx.rules.max_files_changed
}
