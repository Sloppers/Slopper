import { IssueCheckDef } from './issue-check'
import { Indicators } from '../label-factory'

export const issueRiskyUser: IssueCheckDef = {
  label: Indicators.RISKY_USER,
  weight: 1,
  evaluate: ctx => !!ctx.riskyUser
}
