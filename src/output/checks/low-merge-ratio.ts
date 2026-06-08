import { CheckDef } from './check'
import { Indicators } from '../label-factory'

export const lowMergeRatio: CheckDef = {
  label: Indicators.LOW_MERGE_RATIO,
  weight: 1,
  evaluate: ctx => !!ctx.authorProfile && ctx.authorProfile.merge_ratio < ctx.labelThresholds.merge_ratio_suspect
}
