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
      body += `AI analysis was skipped. This PR is automatically approved.\n\n`

      if (ctx.addToSlopperFile) {
        const vouchPrNumber = await this.createVouchPr(ctx.addToSlopperFile, vouchedBy, prNumber)
        if (vouchPrNumber) {
          body += `A PR has been created to add @${prAuthor} to the vouched list: #${vouchPrNumber}\n\n`
        }
      }
    }

    body += `### 🏷️ Labels Applied\n`
    body += labels.map(l => `\`${l}\``).join(' ') + '\n\n'
    body += `---\n*Analysis powered by [slopper](https://github.com/Sloppers/Slopper)*\n`

    await this.commentManager.upsertComment(prNumber, body)
    await this.commentManager.applyLabels(prNumber, labels)

    return ctx
  }

  private async createVouchPr(username: string, voucher: string, prNumber: number): Promise<number | null> {
    const path = `.slopper.d/vouched/${username}`
    const existing = await this.github.getFileContent(path)
    if (existing !== null) {
      this.log(`${username} already in .slopper.d/vouched/`)
      return null
    }

    const content = buildMetadataEntry({
      voucher,
      repo: `${this.github.owner}/${this.github.repo}`,
      pr: `#${prNumber}`,
      reason: '/slopper vouch',
      date: new Date().toISOString()
    })

    try {
      const vouchPr = await this.github.createVouchPr(username, content)
      this.log(`Created vouch PR #${vouchPr} for ${username}`)
      return vouchPr
    } catch (error: unknown) {
      this.warn(`Failed to create vouch PR: ${errorMessage(error)}`)
      return null
    }
  }
}
