import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

const DEPENDENCY_FILES = new Set([
  'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'requirements.txt', 'Pipfile.lock', 'poetry.lock', 'go.sum', 'go.mod',
  'Cargo.lock', 'Gemfile.lock', 'composer.lock', 'pubspec.lock'
])

export class DependenciesModifiedCheck extends Check {
  readonly label = Indicators.DEPENDENCIES_MODIFIED
  readonly defaultWeight = 1

  evaluate(ctx: CheckContext): boolean {
    return ctx.files.some(f => DEPENDENCY_FILES.has(f.filename.split('/').pop() ?? ''))
  }
}
