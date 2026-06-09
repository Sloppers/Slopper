import { IssueCheckDef } from './issue-check'
import { Indicators } from '../label-factory'

export const issueFirstTimeContributor: IssueCheckDef = {
  label: Indicators.FIRST_TIME_CONTRIBUTOR,
  weight: 1,
  evaluate: ctx => ctx.issueData.author.first_time_contributor
}
