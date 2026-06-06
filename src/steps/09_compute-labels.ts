import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { LabelComputer } from '../output/labels'

export class ComputeLabelsStep extends PipelineStep {
  readonly name = 'compute-labels'

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const computer = new LabelComputer(ctx.config?.thresholds, ctx.config?.rules, ctx.config?.label_thresholds)

    if (ctx.analysisFailed) {
      ctx.labels = computer.computeFailedLabels()
      return ctx
    }

    if (!ctx.prData) {
      ctx.labels = computer.computeFailedLabels()
      return ctx
    }

    const isDeterministic = !ctx.analysisResult
    if (isDeterministic) {
      ctx.deterministicScore = LabelComputer.computeDeterministicScore({
        authorProfile: ctx.authorProfile,
        aiFingerprint: ctx.aiFingerprint,
        riskyUser: ctx.riskyUser
      })
      core.info(`[compute-labels] Deterministic score: ${ctx.deterministicScore}/10`)
    }

    ctx.labels = computer.compute({
      analysis: ctx.analysisResult,
      files: ctx.prData.files,
      firstTimeContributor: ctx.prData.author.first_time_contributor,
      prData: ctx.prData,
      authorProfile: ctx.authorProfile,
      aiFingerprint: ctx.aiFingerprint,
      riskyUser: ctx.riskyUser
    })

    return ctx
  }
}
