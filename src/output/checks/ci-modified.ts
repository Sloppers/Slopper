import { CheckDef } from './check'
import { Indicators } from '../label-factory'

export const ciModified: CheckDef = {
  label: Indicators.CI_MODIFIED,
  weight: 1,
  evaluate: ctx => ctx.files.some(f => ctx.patterns.ci_paths.some(p => f.filename.includes(p)))
}
