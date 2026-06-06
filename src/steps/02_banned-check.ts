import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { PrCommentManager } from '../output/commenter'
import { GitHubClient } from '../clients/github'
import { Labels } from '../output/label-factory'

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
    if (!ctx.prAuthor) return ctx

    const reportedBy = await this.findReportCommand(ctx.prNumber)
    if (reportedBy) {
      const isAuthorized = await this.isMaintainer(reportedBy)
      if (isAuthorized) {
        core.info(`[banned-check] Maintainer "${reportedBy}" reported "${ctx.prAuthor}" via /slopper report`)
        await this.addUserToBannedList(ctx.prAuthor, {
          reporter: reportedBy,
          pr: ctx.prNumber,
          repo: `${this.github.owner}/${this.github.repo}`,
        })
        return this.banAndClose(ctx, `reported by maintainer **@${reportedBy}** via \`/slopper report\``)
      } else {
        core.info(`[banned-check] "${reportedBy}" used /slopper report but is not a maintainer — ignoring`)
      }
    }

    const bannedUsers = ctx.config?.banned ?? []
    if (bannedUsers.length === 0) return ctx
    if (!bannedUsers.includes(ctx.prAuthor)) return ctx

    core.info(`[banned-check] Author "${ctx.prAuthor}" is on the banned list — closing PR`)
    return this.banAndClose(ctx, 'the author is on the banned list')
  }

  private async banAndClose(ctx: PipelineContext, reason: string): Promise<PipelineContext> {
    ctx.banned = true

    const labels = [Labels.BANNED.name]
    await this.commentManager.applyLabels(ctx.prNumber, labels)

    const body = `<!-- pr-trust-analysis -->\n` +
      `## 🔴 Slopper — PR Blocked\n\n` +
      `This PR was automatically closed by Slopper — ${reason}.\n\n` +
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

  private async findReportCommand(prNumber: number): Promise<string | null> {
    const comments = await this.github.listComments(prNumber)

    for (const comment of comments) {
      const body = comment.body?.trim() ?? ''
      if (body.match(/^\/slopper\s+report\s*$/im)) {
        return comment.user?.login ?? null
      }
    }
    return null
  }

  private async isMaintainer(username: string): Promise<boolean> {
    const codeownersPaths = ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS']

    for (const path of codeownersPaths) {
      const content = await this.github.getFileContent(path)
      if (content && content.includes(`@${username}`)) {
        return true
      }
    }

    const permission = await this.github.getPermissionLevel(username)
    return ['admin', 'maintain'].includes(permission)
  }

  private async addUserToBannedList(username: string, meta: { reporter: string; pr: number; repo: string }): Promise<void> {
    const path = `.slopper.d/banned/${username}`
    const existing = await this.github.getFileContent(path)
    if (existing !== null) {
      core.info(`[banned-check] ${username} already in .slopper.d/banned/`)
      return
    }

    const content = [
      `reporter: ${meta.reporter}`,
      `repo: ${meta.repo}`,
      `pr: #${meta.pr}`,
      `reason: /slopper report`,
      `date: ${new Date().toISOString()}`,
      '',
    ].join('\n')

    try {
      await this.github.createOrUpdateFile(path, `slopper: ban ${username} (reported)`, content)
      core.info(`[banned-check] Created .slopper.d/banned/${username}`)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      core.warning(`[banned-check] Failed to create banned entry: ${msg}`)
    }
  }
}
