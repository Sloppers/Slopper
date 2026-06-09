import { IssueCheckDef } from './issue-check'
import { Indicators } from '../label-factory'

export const issueMissingDescription: IssueCheckDef = {
  label: Indicators.ISSUE_MISSING_DESCRIPTION,
  weight: 1,
  evaluate: ctx => {
    const body = ctx.issueData.body.trim()
    return body.length < ctx.rules.min_body_length
  }
}
