import { GitHubClient } from './github'

const BOT_URL = 'https://slopper-bot.thegexi.workers.dev'

export class BotGitHubClient extends GitHubClient {
  private readonly botUrl: string
  private readonly oidcToken: string

  constructor(token: string, owner: string, repo: string, oidcToken: string) {
    super(token, owner, repo)
    this.botUrl = BOT_URL
    this.oidcToken = oidcToken
  }

  override async upsertComment(issueNumber: number, marker: string, body: string): Promise<void> {
    await this.callBot({ type: 'upsertComment', pr: issueNumber, marker, body })
  }

  override async createComment(issueNumber: number, body: string): Promise<void> {
    await this.callBot({ type: 'createComment', pr: issueNumber, body })
  }

  override async ensureLabel(name: string, color: string): Promise<void> {
    await this.callBot({ type: 'ensureLabel', name, color })
  }

  override async applyLabels(issueNumber: number, labels: string[]): Promise<void> {
    await this.callBot({ type: 'applyLabels', pr: issueNumber, labels })
  }

  override async removeSlopperLabels(issueNumber: number): Promise<void> {
    await this.callBot({ type: 'removeSlopperLabels', pr: issueNumber })
  }

  override async closePr(prNumber: number): Promise<void> {
    await this.callBot({ type: 'closePr', pr: prNumber })
  }

  override async approvePr(prNumber: number, body: string): Promise<void> {
    await this.callBot({ type: 'approvePr', pr: prNumber, body })
  }

  override async requestReviewers(prNumber: number, reviewers: string[]): Promise<void> {
    await this.callBot({ type: 'requestReviewers', pr: prNumber, reviewers })
  }

  override async createOrUpdateFile(path: string, message: string, content: string): Promise<void> {
    await this.callBot({ type: 'createOrUpdateFile', path, message, content })
  }

  override async createVouchPr(username: string, content: string): Promise<number> {
    const res = await this.callBot({ type: 'createVouchPr', username, content })
    return res.prNumber as number
  }

  override async reportUser(username: string, reporter: string, pr: number): Promise<void> {
    await this.callBot({ type: 'globalReport', username, reporter, pr })
  }

  private async callBot(action: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.botUrl}/api/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oidcToken: this.oidcToken,
        owner: this.owner,
        repo: this.repo,
        action
      })
    })

    const data = await res.json() as Record<string, unknown>

    if (!res.ok) {
      const error = data.error ?? `HTTP ${res.status}`
      throw new Error(`Slopper Bot: ${error}`)
    }

    return data
  }
}
