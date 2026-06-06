import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class LowMergeRatioCheck extends Check {
  readonly label = Labels.LOW_MERGE_RATIO.name
  readonly defaultWeight = 1

  evaluate(ctx: CheckContext): boolean {
    return !!ctx.authorProfile && ctx.authorProfile.merge_ratio < ctx.labelThresholds.merge_ratio_suspect
  }
}
