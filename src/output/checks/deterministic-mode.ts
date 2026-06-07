import { Check, CheckContext } from './check'
import { Indicators } from '../label-factory'

export class DeterministicModeCheck extends Check {
  readonly label = Indicators.DETERMINISTIC_MODE

  evaluate(ctx: CheckContext): boolean {
    return !ctx.analysis
  }
}
