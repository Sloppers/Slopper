import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../pipeline'
import { PrCommentManager } from '../commenter'
import { GitHubClient } from '../clients/github'

export class BannedCheckStep extends PipelineStep {
  readonly name = 'banned-check'
  private readonly github: GitHubClient
  private readonly commentManager: PrCommentManager

  constructor(github: GitHubClient) {
    super()
    this.github = github
    this.commentManager = new PrCommentManager(github)
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const bannedUsers = ctx.config?.banned ?? []
    if (bannedUsers.length === 0 || !ctx.prAuthor) return ctx

    if (!bannedUsers.includes(ctx.prAuthor)) return ctx

    core.info(`[banned-check] Author "${ctx.prAuthor}" is on the banned list — closing PR`)
    ctx.banned = true

    const labels = ['slopper/banned']
    await this.commentManager.applyLabels(ctx.prNumber, labels)

    const body = `<!-- pr-trust-analysis -->\n` +
      `## 🔴 Slopper — PR Blocked\n\n` +
      `This PR was automatically closed by Slopper — the author **@${ctx.prAuthor}** is on the banned list.\n\n` +
      `---\n<sub>Powered by [slopper](https://github.com/malvads/slopper)</sub>\n`

    await this.commentManager.upsertComment(ctx.prNumber, body)

    try {
      await this.github.closePr(ctx.prNumber)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      core.warning(`[banned-check] Failed to close PR: ${msg}`)
    }

    return ctx
  }
}
