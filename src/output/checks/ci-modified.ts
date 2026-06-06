import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

const CI_PATTERNS = [
  '.github/workflows/', '.github/actions/', '.gitlab-ci',
  '.circleci/', '.travis.yml', 'Jenkinsfile', 'azure-pipelines'
]

export class CiModifiedCheck extends Check {
  readonly label = Labels.CI_MODIFIED.name

  evaluate(ctx: CheckContext): boolean {
    return ctx.files.some(f => CI_PATTERNS.some(p => f.filename.includes(p)))
  }
}
