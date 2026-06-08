import { CheckDef, CheckContext } from './check'
import { Indicators } from '../label-factory'

function evaluate(ctx: CheckContext): boolean {
  if (!ctx.prData) return false
  const { commits } = ctx.prData
  return commits.unsigned_count > 0 || commits.author_committer_mismatches > 0
}

function scoreFactor(ctx: CheckContext): number {
  if (!ctx.prData) return 0
  const { commits } = ctx.prData
  if (commits.count === 0) return 0
  const unsignedRatio = commits.unsigned_count / commits.count
  const mismatchRatio = commits.author_committer_mismatches / commits.count
  return Math.min(1, unsignedRatio + mismatchRatio)
}

export const unsignedCommits: CheckDef = {
  label: Indicators.UNSIGNED_COMMITS,
  weight: 1,
  evaluate,
  scoreFactor
}
