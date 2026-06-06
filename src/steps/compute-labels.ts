import { PipelineStep, PipelineContext } from '../pipeline'
import { LabelComputer } from '../labels'

export class ComputeLabelsStep extends PipelineStep {
  readonly name = 'compute-labels'

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const computer = new LabelComputer(ctx.config?.thresholds, ctx.config?.rules)

    if (ctx.analysisFailed || !ctx.analysisResult || !ctx.prData) {
      ctx.labels = computer.computeFailedLabels()
    } else {
      ctx.labels = computer.compute({
        analysis: ctx.analysisResult,
        files: ctx.prData.files,
        firstTimeContributor: ctx.prData.author.first_time_contributor,
        prData: ctx.prData,
        authorProfile: ctx.authorProfile,
        aiFingerprint: ctx.aiFingerprint
      })
    }

    return ctx
  }
}
