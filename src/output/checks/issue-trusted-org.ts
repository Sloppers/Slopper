import { IssueCheckDef } from './issue-check'
import { Indicators } from '../label-factory'

export const issueTrustedOrg: IssueCheckDef = {
  label: Indicators.TRUSTED_ORG,
  weight: -2,
  evaluate: ctx => !!ctx.trustedOrg
}
