import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { PrCommentManager } from '../output/commenter'
import { GitHubClient } from '../clients/github'
import { Labels, Indicators } from '../output/label-factory'
import { errorMessage, buildMetadataEntry } from '../core/utils'

export class VouchApplyStep extends PipelineStep {
  readonly name = 'vouch-apply'
  private readonly github: GitHubClient
  private readonly commentManager: PrCommentManager

  constructor(github: GitHubClient) {
    super()
    this.github = github
    this.commentManager = new PrCommentManager(github)
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.vouched || !ctx.prAuthor || !ctx.vouchedBy) return ctx

    const { prNumber, prAuthor, vouchedBy } = ctx
    const labels = [Labels.VOUCHED.name, Indicators.APPROVED]

    core.setOutput('risk-score', '0')
    core.setOutput('risk-level', 'low')
    core.setOutput('confidence', 'high')
    core.setOutput('labels', labels.join(','))

    let body = `<!-- pr-trust-analysis -->\n`
    body += `## 🟢 PR Trust Analysis — Vouched\n\n`

    if (vouchedBy === '.slopper') {
      body += `**@${prAuthor}** is a vouched contributor (listed in \`.slopper\`).\n\n`
      body += `AI analysis was skipped. This PR is automatically approved.\n\n`
    } else {
      body += `**@${prAuthor}** was vouched for by code owner **@${vouchedBy}**.\n\n`
      body += `AI analysis was skipped. This PR is automatically approved.\n`
      body += `@${prAuthor} has been added to \`.slopper\` for future PRs.\n\n`
    }

    body += `### 🏷️ Labels Applied\n`
    body += labels.map(l => `\`${l}\``).join(' ') + '\n\n'
    body += `---\n*Analysis powered by [slopper](https://github.com/malvads/slopper)*\n`

    await this.commentManager.upsertComment(prNumber, body)
    await this.commentManager.applyLabels(prNumber, labels)

    if (ctx.addToSlopperFile) {
      await this.addUserToSlopperFile(ctx.addToSlopperFile, {
        voucher: vouchedBy,
        pr: prNumber,
        repo: `${this.github.owner}/${this.github.repo}`,
      })
    }

    return ctx
  }

  private async addUserToSlopperFile(username: string, meta: { voucher: string; pr: number; repo: string }): Promise<void> {
    const path = `.slopper.d/vouched/${username}`
    const existing = await this.github.getFileContent(path)
    if (existing !== null) {
      core.info(`[vouch-apply] ${username} already in .slopper.d/vouched/`)
      return
    }

    const content = buildMetadataEntry({
      voucher: meta.voucher, repo: meta.repo,
      pr: `#${meta.pr}`, reason: '/slopper vouch',
      date: new Date().toISOString()
    })

    try {
      await this.github.createOrUpdateFile(path, `slopper: vouch ${username}`, content)
      core.info(`[vouch-apply] Created .slopper.d/vouched/${username}`)
    } catch (error: unknown) {
      core.warning(`[vouch-apply] Failed to create vouch entry: ${errorMessage(error)}`)
    }
  }
}
