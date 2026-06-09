import { PipelineStep, PipelineContext } from '../core/pipeline'
import { GitHubClient } from '../clients/github'
import { errorMessage } from '../core/utils'

export class IssueAutoActionsStep extends PipelineStep {
  readonly name = 'issue-auto-actions'
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    super()
    this.github = github
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.config || !ctx.issueData) return ctx

    const score = ctx.deterministicScore
    if (score === undefined) return ctx

    const rules = ctx.config.issue_rules
    if (!rules) return ctx

    const issueNumber = ctx.prNumber

    if (score >= rules.auto_close_threshold) {
      this.log(`Closing issue — risk score ${score} >= threshold ${rules.auto_close_threshold}`)
      await this.safeCall('close issue', async () => {
        await this.github.createComment(issueNumber,
          'This issue was automatically closed by Slopper — it was flagged as likely AI-generated slop.')
        await this.github.closeIssue(issueNumber)
      })
    }

    if (rules.auto_lock && score >= rules.auto_lock_threshold) {
      this.log(`Locking issue — risk score ${score} >= threshold ${rules.auto_lock_threshold}`)
      await this.safeCall('lock issue', () => this.github.lockIssue(issueNumber, 'spam'))
    }

    return ctx
  }

  private async safeCall(action: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn()
    } catch (error: unknown) {
      this.warn(`Failed to ${action}: ${errorMessage(error)}`)
    }
  }
}
