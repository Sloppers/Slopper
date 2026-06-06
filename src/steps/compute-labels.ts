import { PipelineStep, PipelineContext } from '../pipeline'
import { LabelComputer } from '../labels'
import { AnalysisResult, PrData } from '../types'

/**
 * Pipeline step that deterministically computes labels from the AI analysis result.
 *
 * Labels are derived from risk score, confidence, file paths, and author metadata —
 * never from AI suggestions. This ensures consistent, predictable labeling.
 *
 * Reads `analysisResult`, `prData`, and `analysisFailed` from context.
 * Writes `labels` to context.
 */
export class ComputeLabelsStep extends PipelineStep {
  readonly name = 'compute-labels'

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const computer = new LabelComputer()

    if (ctx.analysisFailed) {
      ctx.labels = computer.computeFailedLabels()
    } else {
      const result = ctx.analysisResult as AnalysisResult
      const prData = ctx.prData as PrData
      ctx.labels = computer.compute(result, prData.files, prData.author.first_time_contributor)
    }

    return ctx
  }
}
