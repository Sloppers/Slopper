export { Check, StaticCheck, CheckContext, ScoreResult } from './check'
export { AgenticCheck, AgenticCheckResult, AgenticCheckContext } from './agentic-check'
export { allAgenticChecks } from './agentic'
export { FirstTimeContributorCheck } from './first-time-contributor'
export { CiModifiedCheck } from './ci-modified'
export { DependenciesModifiedCheck } from './dependencies-modified'
export { SprayAndPrayCheck } from './spray-and-pray'
export { ActivityBurstCheck } from './activity-burst'
export { NewAccountCheck } from './new-account'
export { MissingDescriptionCheck } from './missing-description'
export { NoLinkedIssueCheck } from './no-linked-issue'
export { TooManyFilesCheck } from './too-many-files'
export { RiskyUserCheck } from './risky-user'
export { TrustedOrgCheck } from './trusted-org'
export { HeavyChangesCheck } from './heavy-changes'
export { LargeFileCheck } from './large-file'
export { LowMergeRatioCheck } from './low-merge-ratio'
export { SupplyChainCheck } from './supply-chain'
export { UnsignedCommitsCheck } from './unsigned-commits'
export { NoTestsCheck } from './no-tests'
export { CodeDuplicationCheck } from './code-duplication'

import { Check, ScoreResult } from './check'
import { FirstTimeContributorCheck } from './first-time-contributor'
import { CiModifiedCheck } from './ci-modified'
import { DependenciesModifiedCheck } from './dependencies-modified'
import { SprayAndPrayCheck } from './spray-and-pray'
import { ActivityBurstCheck } from './activity-burst'
import { NewAccountCheck } from './new-account'
import { MissingDescriptionCheck } from './missing-description'
import { NoLinkedIssueCheck } from './no-linked-issue'
import { TooManyFilesCheck } from './too-many-files'
import { RiskyUserCheck } from './risky-user'
import { TrustedOrgCheck } from './trusted-org'
import { HeavyChangesCheck } from './heavy-changes'
import { LargeFileCheck } from './large-file'
import { LowMergeRatioCheck } from './low-merge-ratio'
import { SupplyChainCheck } from './supply-chain'
import { UnsignedCommitsCheck } from './unsigned-commits'
import { NoTestsCheck } from './no-tests'
import { CodeDuplicationCheck } from './code-duplication'

const ALL_CHECKS: Check[] = [
  new FirstTimeContributorCheck(),
  new CiModifiedCheck(),
  new DependenciesModifiedCheck(),
  new SprayAndPrayCheck(),
  new ActivityBurstCheck(),
  new NewAccountCheck(),
  new MissingDescriptionCheck(),
  new NoLinkedIssueCheck(),
  new TooManyFilesCheck(),
  new RiskyUserCheck(),
  new TrustedOrgCheck(),
  new HeavyChangesCheck(),
  new LargeFileCheck(),
  new LowMergeRatioCheck(),
  new SupplyChainCheck(),
  new UnsignedCommitsCheck(),
  new NoTestsCheck(),
  new CodeDuplicationCheck()
]

export function allChecks(): Check[] {
  return [...ALL_CHECKS]
}

export function computeScore(checks: Check[], ctx: import('./check').CheckContext, weights?: Record<string, number>): { score: number; breakdown: ScoreResult[] } {
  const breakdown: ScoreResult[] = []
  let total = 0

  for (const check of checks) {
    const key = check.label.replace('slopper/', '').replace(/[-/]/g, '_')
    const weight = weights?.[key] ?? check.defaultWeight
    const factor = check.scoreFactor(ctx)
    const points = factor * weight
    total += points
    breakdown.push({ key, factor, weight, points })
  }

  const score = Math.max(0, Math.min(10, Math.round(total * 10) / 10))
  return { score, breakdown }
}
