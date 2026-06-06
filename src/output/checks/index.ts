export { Check, StaticCheck, CheckContext, ScoreResult } from './check'
export { AgenticCheck, AgenticCheckResult, AgenticCheckContext } from './agentic-check'
export { allAgenticChecks } from './agentic'
export { ApprovedCheck } from './approved'
export { DeterministicModeCheck } from './deterministic-mode'
export { FirstTimeContributorCheck } from './first-time-contributor'
export { CiModifiedCheck } from './ci-modified'
export { DependenciesModifiedCheck } from './dependencies-modified'
export { SecurityReviewCheck } from './security-review'
export { SuspiciousCheck } from './suspicious'
export { SprayAndPrayCheck } from './spray-and-pray'
export { ActivityBurstCheck } from './activity-burst'
export { NewAccountCheck } from './new-account'
export { LikelyAiCheck } from './likely-ai'
export { PossiblyAiCheck } from './possibly-ai'
export { MissingDescriptionCheck } from './missing-description'
export { NoLinkedIssueCheck } from './no-linked-issue'
export { TooManyFilesCheck } from './too-many-files'
export { RiskyUserCheck } from './risky-user'
export { TrustedOrgCheck } from './trusted-org'
export { HeavyChangesCheck } from './heavy-changes'
export { LargeFileCheck } from './large-file'
export { LowMergeRatioCheck } from './low-merge-ratio'

import { Check, ScoreResult } from './check'
import { ApprovedCheck } from './approved'
import { DeterministicModeCheck } from './deterministic-mode'
import { FirstTimeContributorCheck } from './first-time-contributor'
import { CiModifiedCheck } from './ci-modified'
import { DependenciesModifiedCheck } from './dependencies-modified'
import { SecurityReviewCheck } from './security-review'
import { SuspiciousCheck } from './suspicious'
import { SprayAndPrayCheck } from './spray-and-pray'
import { ActivityBurstCheck } from './activity-burst'
import { NewAccountCheck } from './new-account'
import { LikelyAiCheck } from './likely-ai'
import { PossiblyAiCheck } from './possibly-ai'
import { MissingDescriptionCheck } from './missing-description'
import { NoLinkedIssueCheck } from './no-linked-issue'
import { TooManyFilesCheck } from './too-many-files'
import { RiskyUserCheck } from './risky-user'
import { TrustedOrgCheck } from './trusted-org'
import { HeavyChangesCheck } from './heavy-changes'
import { LargeFileCheck } from './large-file'
import { LowMergeRatioCheck } from './low-merge-ratio'

const ALL_CHECKS: Check[] = [
  new ApprovedCheck(),
  new DeterministicModeCheck(),
  new FirstTimeContributorCheck(),
  new CiModifiedCheck(),
  new DependenciesModifiedCheck(),
  new SecurityReviewCheck(),
  new SuspiciousCheck(),
  new SprayAndPrayCheck(),
  new ActivityBurstCheck(),
  new NewAccountCheck(),
  new LikelyAiCheck(),
  new PossiblyAiCheck(),
  new MissingDescriptionCheck(),
  new NoLinkedIssueCheck(),
  new TooManyFilesCheck(),
  new RiskyUserCheck(),
  new TrustedOrgCheck(),
  new HeavyChangesCheck(),
  new LargeFileCheck(),
  new LowMergeRatioCheck()
]

export function allChecks(): Check[] {
  return [...ALL_CHECKS]
}

export function computeScore(checks: Check[], ctx: import('./check').CheckContext, weights?: Record<string, number>): { score: number; breakdown: ScoreResult[] } {
  const breakdown: ScoreResult[] = []
  let total = 0

  for (const check of checks) {
    if (check.defaultWeight === 0 && !weights) continue
    const key = check.label.replace('slopper/', '').replace(/\//g, '_')
    const weight = weights?.[key] ?? check.defaultWeight
    if (weight === 0) continue
    const factor = check.scoreFactor(ctx)
    const points = factor * weight
    total += points
    breakdown.push({ key, factor, weight, points })
  }

  const score = Math.max(0, Math.min(10, Math.round(total * 10) / 10))
  return { score, breakdown }
}
