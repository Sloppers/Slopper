import { PipelineStep, PipelineContext } from '../core/pipeline'
import { buildIssueCheckContext, IssueScoreResult } from '../output/checks/issue-check'
import { allIssueChecks } from '../output/checks/issue-registry'
import { Labels, riskLabel } from '../output/label-factory'

export class ComputeIssueLabelsStep extends PipelineStep {
  readonly name = 'compute-issue-labels'

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.issueData) {
      ctx.labels = [Labels.ANALYSIS_FAILED.name]
      return ctx
    }

    const checks = allIssueChecks()
    const checkCtx = buildIssueCheckContext({
      score: 0,
      issueData: ctx.issueData,
      authorProfile: ctx.authorProfile,
      recentIssues: ctx.recentIssues,
      riskyUser: ctx.riskyUser,
      trustedOrg: ctx.trustedOrg,
      verifiedOrg: ctx.verifiedOrg
    }, ctx.config)

    const breakdown: IssueScoreResult[] = []
    let raw = 0

    for (const check of checks) {
      const triggered = check.evaluate(checkCtx)
      const factor = triggered ? (check.scoreFactor?.(checkCtx) ?? 1) : 0
      const points = factor * check.weight
      raw += points
      breakdown.push({
        key: check.label,
        factor,
        weight: check.weight,
        points
      })
    }

    const score = Math.max(0, Math.min(10, Math.round(raw * 10) / 10))
    ctx.deterministicScore = score
    ctx.signalBreakdown = breakdown

    const active = breakdown
      .filter(s => s.points !== 0)
      .map(s => `${s.key}=${s.points > 0 ? '+' : ''}${s.points}`)
      .join(', ')
    this.log(`Issue score: ${score}/10 [${active}]`)

    const thresholds = ctx.config?.thresholds ?? { low: 2, medium: 5, high: 8 }
    ctx.labels = score >= thresholds.medium ? [Labels.SLOP.name] : [Labels.LEGIT.name]

    const indicators: string[] = [riskLabel(score, thresholds)]

    for (const check of checks) {
      if (check.evaluate(checkCtx)) {
        indicators.push(check.label)
      }
    }

    if (ctx.agenticResults) {
      for (const result of ctx.agenticResults) {
        if (result.triggered) {
          indicators.push(result.label)
        }
      }
    }

    ctx.indicators = indicators

    return ctx
  }
}
