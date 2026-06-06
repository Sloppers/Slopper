import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { LabelComputer } from '../output/labels'

export class ComputeLabelsStep extends PipelineStep {
  readonly name = 'compute-labels'

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const computer = new LabelComputer(ctx.config?.thresholds, ctx.config?.rules, ctx.config?.label_thresholds)

    if (!ctx.prData) {
      ctx.labels = computer.computeFailedLabels()
      return ctx
    }

    const analysis = ctx.analysisFailed ? undefined : ctx.analysisResult

    const opts = {
      analysis,
      files: ctx.prData.files,
      firstTimeContributor: ctx.prData.author.first_time_contributor,
      prData: ctx.prData,
      authorProfile: ctx.authorProfile,
      aiFingerprint: ctx.aiFingerprint,
      riskyUser: ctx.riskyUser,
      trustedOrg: ctx.trustedOrg
    }

    const result = computer.computeScoreFromChecks(opts)
    ctx.deterministicScore = result.score
    ctx.signalBreakdown = result.breakdown
    const active = result.breakdown.filter(s => s.points !== 0).map(s => `${s.key}=${s.points > 0 ? '+' : ''}${s.points}`).join(', ')
    core.info(`[compute-labels] Deterministic score: ${ctx.deterministicScore}/10 [${active}]`)

    ctx.labels = computer.compute(opts)

    if (ctx.analysisFailed) {
      ctx.labels.push('slopper/analysis-failed')
    }

    if (ctx.agenticResults) {
      for (const result of ctx.agenticResults) {
        if (result.triggered) {
          ctx.labels.push(result.label)
        }
      }
    }

    return ctx
  }
}
