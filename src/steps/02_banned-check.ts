import { PipelineStep, PipelineContext } from '../core/pipeline'
import { PrCommentManager } from '../output/commenter'
import { GitHubClient } from '../clients/github'
import { SlopperClient } from '../clients/slopper'
import { Labels } from '../output/label-factory'
import { errorMessage, buildMetadataEntry } from '../core/utils'

export class BannedCheckStep extends PipelineStep {
  readonly name = 'banned-check'
  private readonly github: GitHubClient
  private readonly slopper: SlopperClient
  private readonly commentManager: PrCommentManager

  constructor(github: GitHubClient, slopper: SlopperClient) {
    super()
    this.github = github
    this.slopper = slopper
    this.commentManager = new PrCommentManager(github)
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.prAuthor) return ctx

    const report = await this.findReportCommand(ctx.prNumber)
    if (report) {
      const isAuthorized = await this.github.isMaintainer(report.reporter)
      if (isAuthorized) {
        this.log(`Maintainer "${report.reporter}" reported "${ctx.prAuthor}" via /slopper report`)
        const banPrNumber = await this.addUserToBannedList(ctx.prAuthor, {
          reporter: report.reporter,
          pr: ctx.prNumber,
          repo: `${this.github.owner}/${this.github.repo}`,
        })
        await this.reportUserGlobally(ctx.prAuthor, report.reporter, ctx.prNumber)

        let reason = `reported by maintainer **@${report.reporter}** via \`/slopper report\`.\n\n`
        if (banPrNumber) {
          reason += `> A ban PR has been created: #${banPrNumber} — close it to unban.\n\n`
        }
        reason += `> This account has been reported to the [Slopper global community list](https://github.com/Sloppers/community-list). ` +
          `All Slopper installations will flag this account going forward.`
        return this.banAndClose(ctx, reason)
      } else {
        this.log(`"${report.reporter}" used /slopper report but is not a maintainer — ignoring`)
      }
    }

    const bannedUsers = ctx.config?.banned ?? []
    if (bannedUsers.length > 0 && bannedUsers.includes(ctx.prAuthor)) {
      this.log(`Author "${ctx.prAuthor}" is on the banned list — closing PR`)
      return this.banAndClose(ctx, 'the author is on the banned list')
    }

    return ctx
  }

  private async reportUserGlobally(reportedUser: string, reporter: string, prNumber: number): Promise<void> {
    try {
      await this.github.reportUser(reportedUser, reporter, prNumber)
      this.log(`Reported "${reportedUser}" to Slopper global community list`)
    } catch (error: unknown) {
      this.warn(`Global report failed: ${errorMessage(error)}`)
    }
  }

  private async banAndClose(ctx: PipelineContext, reason: string): Promise<PipelineContext> {
    ctx.banned = true

    const labels = [Labels.BANNED.name]
    await this.commentManager.applyLabels(ctx.prNumber, labels)

    const body = `<!-- pr-trust-analysis -->\n` +
      `## 🔴 Slopper — PR Blocked\n\n` +
      `This PR was automatically closed by Slopper — ${reason}.\n\n` +
      `---\n<sub>Powered by [slopper](https://github.com/Sloppers/Slopper)</sub>\n`

    await this.commentManager.upsertComment(ctx.prNumber, body)

    try {
      await this.github.closePr(ctx.prNumber)
    } catch (error: unknown) {
      this.warn(`Failed to close PR: ${errorMessage(error)}`)
    }

    return ctx
  }

  private async findReportCommand(prNumber: number): Promise<{ reporter: string; commentId: number } | null> {
    const comments = await this.github.listComments(prNumber)

    for (const comment of comments) {
      const body = comment.body?.trim() ?? ''
      if (body.match(/^\/slopper\s+report\s*$/im)) {
        const login = comment.user?.login
        if (login) return { reporter: login, commentId: comment.id }
      }
    }
    return null
  }

  private async addUserToBannedList(username: string, meta: { reporter: string; pr: number; repo: string }): Promise<number | null> {
    const path = `.slopper.d/banned/${username}`
    const existing = await this.github.getFileContent(path)
    if (existing !== null) {
      this.log(`${username} already in .slopper.d/banned/`)
      return null
    }

    const content = buildMetadataEntry({
      reporter: meta.reporter, repo: meta.repo,
      pr: `#${meta.pr}`, reason: '/slopper report',
      date: new Date().toISOString()
    })

    try {
      const banPr = await this.github.createBanPr(username, content)
      this.log(`Created ban PR #${banPr} for ${username}`)
      return banPr
    } catch (error: unknown) {
      this.warn(`Failed to create ban PR: ${errorMessage(error)}`)
      return null
    }
  }
}
