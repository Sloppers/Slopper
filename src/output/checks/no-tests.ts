import { CheckDef, CheckContext } from './check'
import { Indicators } from '../label-factory'

function evaluate(ctx: CheckContext): boolean {
  const testRegexes = ctx.patterns.test_patterns.map(p => new RegExp(p))
  const extRegex = new RegExp('\\.(' + ctx.patterns.source_extensions.join('|') + ')$')
  const isTest = (f: string) => testRegexes.some(r => r.test(f))

  const sourceFiles = ctx.files.filter(f =>
    extRegex.test(f.filename) && !isTest(f.filename) && f.additions > 0
  )
  if (sourceFiles.length === 0) return false

  return ctx.files.filter(f => isTest(f.filename) && f.additions > 0).length === 0
}

export const noTests: CheckDef = {
  label: Indicators.NO_TESTS,
  weight: 1,
  evaluate
}
