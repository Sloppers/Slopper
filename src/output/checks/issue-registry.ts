import { IssueCheckDef, IssueAgenticCheckDef } from './issue-check'
import { issueNewAccount } from './issue-new-account'
import { issueSprayAndPray } from './issue-spray-and-pray'
import { issueActivityBurst } from './issue-activity-burst'
import { issueRiskyUser } from './issue-risky-user'
import { issueTrustedOrg } from './issue-trusted-org'
import { issueVerifiedOrg } from './issue-verified-org'
import { issueFirstTimeContributor } from './issue-first-time-contributor'
import { issueMissingDescription } from './issue-missing-description'
import { issueLowEffort } from './issue-low-effort'
import { issueDuplicate } from './issue-duplicate'
import { issueSlopContent } from './issue-slop-content'
import { issueSuspiciousAuthor } from './issue-suspicious-author'

export const ALL_ISSUE_CHECKS: IssueCheckDef[] = [
  issueFirstTimeContributor,
  issueNewAccount,
  issueSprayAndPray,
  issueActivityBurst,
  issueRiskyUser,
  issueTrustedOrg,
  issueVerifiedOrg,
  issueMissingDescription,
  issueLowEffort,
  issueDuplicate
]

export const ALL_ISSUE_AGENTIC_CHECKS: IssueAgenticCheckDef[] = [
  issueSlopContent,
  issueSuspiciousAuthor
]

export function allIssueChecks(): IssueCheckDef[] {
  return [...ALL_ISSUE_CHECKS]
}

export function allIssueAgenticChecks(): IssueAgenticCheckDef[] {
  return [...ALL_ISSUE_AGENTIC_CHECKS]
}
