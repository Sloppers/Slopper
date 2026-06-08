import { CheckDef, basename } from './check'
import { Indicators } from '../label-factory'

export const dependenciesModified: CheckDef = {
  label: Indicators.DEPENDENCIES_MODIFIED,
  weight: 1,
  evaluate: ctx => ctx.files.some(f => new Set(ctx.patterns.dependency_files).has(basename(f.filename)))
}
