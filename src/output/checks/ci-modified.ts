import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

const CI_PATTERNS = [
  '.github/workflows/', '.github/actions/', '.gitlab-ci',
  '.circleci/', '.travis.yml', 'Jenkinsfile', 'azure-pipelines'
]

export class CiModifiedCheck extends Check {
  readonly label = Indicators.CI_MODIFIED

  evaluate(ctx: CheckContext): boolean {
    return ctx.files.some(f => CI_PATTERNS.some(p => f.filename.includes(p)))
  }
}
