import { IssueCheckDef } from './issue-check'
import { Indicators } from '../label-factory'

export const issueSprayAndPray: IssueCheckDef = {
  label: Indicators.SPRAY_AND_PRAY,
  weight: 3,
  evaluate: ctx => !!ctx.authorProfile && ctx.authorProfile.spray_score > ctx.labelThresholds.spray_score,
  scoreFactor: ctx => ctx.authorProfile ? ctx.authorProfile.spray_score / 100 : 0
}
