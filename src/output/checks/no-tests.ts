import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

const TEST_PATTERNS = [
  /\/__tests__\//,
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /_test\.go$/,
  /test_.*\.py$/,
  /.*_test\.py$/,
  /\/tests?\//,
  /\.tests?\.[jt]sx?$/,
]

const SOURCE_EXTENSIONS = /\.(ts|tsx|js|jsx|py|go|rb|java|rs|cs|cpp|c|swift|kt)$/

export class NoTestsCheck extends Check {
  readonly label = Indicators.NO_TESTS
  readonly defaultWeight = 1

  evaluate(ctx: CheckContext): boolean {
    const sourceFiles = ctx.files.filter(f =>
      SOURCE_EXTENSIONS.test(f.filename) && !isTestFile(f.filename) && f.additions > 0
    )
    if (sourceFiles.length === 0) return false

    const testFiles = ctx.files.filter(f => isTestFile(f.filename) && f.additions > 0)
    return testFiles.length === 0
  }
}

function isTestFile(filename: string): boolean {
  return TEST_PATTERNS.some(p => p.test(filename))
}
