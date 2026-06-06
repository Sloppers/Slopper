import { Check, CheckContext } from './check'
import { Labels } from '../label-factory'

export class UnsignedCommitsCheck extends Check {
  readonly label = Labels.UNSIGNED_COMMITS.name
  readonly defaultWeight = 1

  evaluate(ctx: CheckContext): boolean {
    if (!ctx.prData) return false
    const { commits } = ctx.prData
    return commits.unsigned_count > 0 || commits.author_committer_mismatches > 0
  }

  scoreFactor(ctx: CheckContext): number {
    if (!ctx.prData) return 0
    const { commits } = ctx.prData
    if (commits.count === 0) return 0
    const unsignedRatio = commits.unsigned_count / commits.count
    const mismatchRatio = commits.author_committer_mismatches / commits.count
    return Math.min(1, unsignedRatio + mismatchRatio)
  }
}
