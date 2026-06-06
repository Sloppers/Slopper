import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class SprayAndPrayCheck extends Check {
  readonly label = Labels.SPRAY_AND_PRAY.name

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.authorProfile && ctx.authorProfile.spray_score > ctx.labelThresholds.spray_score
  }
}
