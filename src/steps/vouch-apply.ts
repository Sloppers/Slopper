import * as core from '@actions/core'
import * as github from '@actions/github'
import { PipelineStep, PipelineContext } from '../pipeline'
import { PrCommentManager } from '../commenter'

type Octokit = ReturnType<typeof github.getOctokit>

/**
 * Pipeline step that applies vouching results.
 *
 * If the PR was vouched (either via .slopper file or /slopper vouch command),
 * this step:
 * 1. Applies the slopper/vouched and slopper/approved labels
 * 2. Posts a comment confirming the vouch
 * 3. If a new user was vouched, commits them to the .slopper file
 *
 * Reads `vouched`, `vouchedBy`, `addToSlopperFile`, `prAuthor`, `prNumber` from context.
 * This step only runs when `vouched` is true.
 */
export class VouchApplyStep extends PipelineStep {
  readonly name = 'vouch-apply'
  private octokit: Octokit
  private owner: string
  private repo: string
  private commentManager: PrCommentManager

  /**
   * @param octokit - Authenticated Octokit instance.
   * @param owner - Repository owner.
   * @param repo - Repository name.
   */
  constructor(octokit: Octokit, owner: string, repo: string) {
    super()
    this.octokit = octokit
    this.owner = owner
    this.repo = repo
    this.commentManager = new PrCommentManager(octokit, owner, repo)
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.vouched) return ctx

    const prNumber = ctx.prNumber as number
    const prAuthor = ctx.prAuthor as string
    const vouchedBy = ctx.vouchedBy as string
    const labels = ['slopper/vouched', 'slopper/approved']

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
      await this.addUserToSlopperFile(ctx.addToSlopperFile as string)
    }

    return ctx
  }

  /**
   * Adds a username to the .slopper file in the repository.
   * Creates the file if it doesn't exist.
   * @param username - GitHub username to add.
   */
  private async addUserToSlopperFile(username: string): Promise<void> {
    let currentContent = ''
    let sha: string | undefined

    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: '.slopper'
      })
      if ('content' in data && data.content) {
        currentContent = Buffer.from(data.content, 'base64').toString('utf-8')
        sha = data.sha
      }
    } catch {
      // File doesn't exist yet.
    }

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
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: '.slopper',
        message: `slopper: vouch ${username}`,
        content: Buffer.from(newContent).toString('base64'),
        ...(sha ? { sha } : {})
      })
      core.info(`Added ${username} to .slopper file`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      core.warning(`Failed to update .slopper file: ${msg}`)
    }
  }
}
