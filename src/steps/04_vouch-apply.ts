import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { PrCommentManager } from '../output/commenter'
import { GitHubClient } from '../clients/github'
import { Labels } from '../output/label-factory'

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
    const labels = [Labels.VOUCHED.name, Labels.APPROVED.name]

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
      await this.addUserToSlopperFile(ctx.addToSlopperFile)
    }

    return ctx
  }

  private async addUserToSlopperFile(username: string): Promise<void> {
    const currentContent = await this.github.getFileContent('.slopper') ?? ''

    const users = currentContent
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))

    if (users.includes(username)) {
      core.info(`${username} already in .slopper file`)
      return
    }

    const header = '# Vouched contributors — these users bypass slopper AI analysis.\n'
    const existingUsers = currentContent
      .split('\n')
      .filter(l => l.trim() && !l.startsWith('#'))

    const newContent = header + [...existingUsers, username].join('\n') + '\n'

    try {
      await this.github.createOrUpdateFile('.slopper', `slopper: vouch ${username}`, newContent)
      core.info(`Added ${username} to .slopper file`)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      core.warning(`Failed to update .slopper file: ${msg}`)
    }
  }
}
