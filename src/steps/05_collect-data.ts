import * as core from '@actions/core'
import { minimatch } from 'minimatch'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { PrDataCollector } from '../analysis/collector'
import { GitHubClient } from '../clients/github'

export class CollectDataStep extends PipelineStep {
  readonly name = 'collect-data'
  private readonly collector: PrDataCollector

  constructor(github: GitHubClient) {
    super()
    this.collector = new PrDataCollector(github)
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    ctx.prData = await this.collector.collect(ctx.prNumber)

    const ignorePaths = ctx.config?.ignore_paths ?? []
    if (ignorePaths.length > 0 && ctx.prData) {
      const before = ctx.prData.files.length
      ctx.prData = {
        ...ctx.prData,
        files: ctx.prData.files.filter(
          f => !ignorePaths.some(pattern => minimatch(f.filename, pattern))
        )
      }
      const filtered = before - ctx.prData.files.length
      if (filtered > 0) {
        core.info(`[collect-data] Filtered ${filtered} files matching ignore_paths`)
      }
    }

    return ctx
  }
}
