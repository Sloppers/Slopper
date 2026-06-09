import { PipelineStep, PipelineContext } from '../core/pipeline'
import { IssueDataCollector } from '../analysis/issue-collector'
import { GitHubClient } from '../clients/github'

export class CollectIssueDataStep extends PipelineStep {
  readonly name = 'collect-issue-data'
  private readonly collector: IssueDataCollector

  constructor(github: GitHubClient) {
    super()
    this.collector = new IssueDataCollector(github)
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    ctx.issueData = await this.collector.collect(ctx.prNumber)

    if (ctx.issueData.is_pull_request) {
      this.warn('Issue is actually a PR — skipping issue analysis')
      return ctx
    }

    ctx.prAuthor = ctx.issueData.author.login

    const lookback = ctx.config?.issue_rules?.duplicate_lookback ?? 50
    ctx.recentIssues = await this.collector.collectRecentIssues(lookback, ctx.prNumber)
    this.log(`Collected issue #${ctx.prNumber} and ${ctx.recentIssues.length} recent issues for duplicate detection`)

    return ctx
  }
}
