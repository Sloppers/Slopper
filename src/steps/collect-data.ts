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
  private collector: PrDataCollector

  /**
   * @param octokit - Authenticated Octokit instance.
   * @param owner - Repository owner.
   * @param repo - Repository name.
   */
  constructor(octokit: Octokit, owner: string, repo: string) {
    super()
    this.collector = new PrDataCollector(octokit, owner, repo)
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const prNumber = ctx.prNumber as number
    ctx.prData = await this.collector.collect(prNumber)
    return ctx
  }
}
