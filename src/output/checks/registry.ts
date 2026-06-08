import { CheckDef, AgenticCheckDef } from './check'
import { firstTimeContributor } from './first-time-contributor'
import { ciModified } from './ci-modified'
import { dependenciesModified } from './dependencies-modified'
import { sprayAndPray } from './spray-and-pray'
import { activityBurst } from './activity-burst'
import { newAccount } from './new-account'
import { missingDescription } from './missing-description'
import { noLinkedIssue } from './no-linked-issue'
import { tooManyFiles } from './too-many-files'
import { riskyUser } from './risky-user'
import { trustedOrg } from './trusted-org'
import { heavyChanges } from './heavy-changes'
import { largeFile } from './large-file'
import { lowMergeRatio } from './low-merge-ratio'
import { supplyChain } from './supply-chain'
import { unsignedCommits } from './unsigned-commits'
import { noTests } from './no-tests'
import { codeDuplication } from './code-duplication'
import { verifiedOrg } from './verified-org'
import { slopContent } from './slop-content'
import { descriptionMismatch } from './description-mismatch'
import { codeQuality } from './code-quality'
import { securityConcern } from './security-concern'
import { suspiciousAuthor } from './suspicious-author'

export const ALL_CHECKS: CheckDef[] = [
  firstTimeContributor,
  ciModified,
  dependenciesModified,
  sprayAndPray,
  activityBurst,
  newAccount,
  missingDescription,
  noLinkedIssue,
  tooManyFiles,
  riskyUser,
  trustedOrg,
  heavyChanges,
  largeFile,
  lowMergeRatio,
  supplyChain,
  unsignedCommits,
  noTests,
  codeDuplication,
  verifiedOrg
]

export const ALL_AGENTIC_CHECKS: AgenticCheckDef[] = [
  slopContent,
  descriptionMismatch,
  codeQuality,
  securityConcern,
  suspiciousAuthor
]

export function allAgenticChecks(): AgenticCheckDef[] {
  return [...ALL_AGENTIC_CHECKS]
}
