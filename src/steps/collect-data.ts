import * as github from '@actions/github'
import { PipelineStep, PipelineContext } from '../pipeline'
import { PrDataCollector } from '../collector'

type Octokit = ReturnType<typeof github.getOctokit>

/**
 * Pipeline step that collects all PR data from the GitHub API.
 *
 * Reads `prNumber` from context.
 * Writes `prData` to context.
 */
export class CollectDataStep extends PipelineStep {
  readonly name = 'collect-data'
  private readonly collector: PrDataCollector

  constructor(octokit: Octokit, owner: string, repo: string) {
    super()
    this.collector = new PrDataCollector(octokit, owner, repo)
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    ctx.prData = await this.collector.collect(ctx.prNumber)
    return ctx
  }
}
