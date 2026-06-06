import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class DeterministicModeCheck extends Check {
  readonly label = Labels.DETERMINISTIC_MODE.name

  evaluate(ctx: CheckContext): boolean {
    return !ctx.analysis
  }
}
