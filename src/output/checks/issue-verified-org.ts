import { IssueCheckDef } from './issue-check'
import { Indicators } from '../label-factory'

export const issueVerifiedOrg: IssueCheckDef = {
  label: Indicators.VERIFIED_ORG,
  weight: -1,
  evaluate: ctx => !!ctx.verifiedOrg
}
