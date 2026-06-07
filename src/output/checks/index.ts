export { Check, StaticCheck, CheckContext, ScoreResult } from './check'
export { AgenticCheck, AgenticCheckResult, AgenticCheckContext } from './agentic-check'
export { DerivedIndicator, allDerivedIndicators } from './derived-indicator'
export { allAgenticChecks } from './agentic'
export { allStaticChecks } from './static'
export {
  FirstTimeContributorCheck, CiModifiedCheck, DependenciesModifiedCheck,
  SprayAndPrayCheck, ActivityBurstCheck, NewAccountCheck,
  MissingDescriptionCheck, NoLinkedIssueCheck, TooManyFilesCheck,
  RiskyUserCheck, TrustedOrgCheck, HeavyChangesCheck,
  LargeFileCheck, LowMergeRatioCheck, SupplyChainCheck,
  UnsignedCommitsCheck, NoTestsCheck, CodeDuplicationCheck,
  VerifiedOrgCheck
} from './static'

import { Check, ScoreResult } from './check'
import { allStaticChecks } from './static'

export function allChecks(): Check[] {
  return allStaticChecks()
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
