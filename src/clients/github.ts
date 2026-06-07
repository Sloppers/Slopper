import * as github from '@actions/github'

type Octokit = ReturnType<typeof github.getOctokit>

export class GitHubClient {
  private readonly octokit: Octokit
  readonly owner: string
  readonly repo: string

  constructor(token: string, owner: string, repo: string) {
    this.octokit = github.getOctokit(token)
    this.owner = owner
    this.repo = repo
  }

  async getPr(prNumber: number) {
    const { data } = await this.octokit.rest.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber
    })
    return data
  }

  async getPrDiff(prNumber: number): Promise<string> {
    const { data } = await this.octokit.rest.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      mediaType: { format: 'diff' }
    })
    let diff = String(data)
    if (diff.length > 80_000) {
      diff = diff.slice(0, 80_000) + '\n\n[... diff truncated for analysis ...]'
    }
    return diff
  }

  async listPrCommits(prNumber: number) {
    const { data } = await this.octokit.rest.pulls.listCommits({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      per_page: 100
    })
    return data
  }

  async listPrFiles(prNumber: number) {
    const { data } = await this.octokit.rest.pulls.listFiles({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      per_page: 100
    })
    return data
  }

  async closePr(prNumber: number): Promise<void> {
    await this.octokit.rest.pulls.update({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      state: 'closed'
    })
  }

  async approvePr(prNumber: number, body: string): Promise<void> {
    await this.octokit.rest.pulls.createReview({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      event: 'APPROVE',
      body
    })
  }

  async requestReviewers(prNumber: number, reviewers: string[]): Promise<void> {
    await this.octokit.rest.pulls.requestReviewers({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      reviewers
    })
  }

  async upsertComment(issueNumber: number, marker: string, body: string): Promise<void> {
    const { data: comments } = await this.octokit.rest.issues.listComments({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber
    })

    const existing = comments.find(c => c.body?.includes(marker))

    if (existing) {
      await this.octokit.rest.issues.updateComment({
        owner: this.owner,
        repo: this.repo,
        comment_id: existing.id,
        body
      })
    } else {
      await this.octokit.rest.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body
      })
    }
  }

  async createComment(issueNumber: number, body: string): Promise<void> {
    await this.octokit.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body
    })
  }

  async ensureLabel(name: string, color: string): Promise<void> {
    try {
      await this.octokit.rest.issues.getLabel({
        owner: this.owner,
        repo: this.repo,
        name
      })
    } catch (e: unknown) {
      const status = e && typeof e === 'object' && 'status' in e ? (e as { status: number }).status : undefined
      if (status === 404) {
        await this.octokit.rest.issues.createLabel({
          owner: this.owner,
          repo: this.repo,
          name,
          color,
          description: 'Slopper PR trust analysis label'
        })
      }
    }
  }

  async applyLabels(issueNumber: number, labels: string[]): Promise<void> {
    await this.octokit.rest.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels
    })
  }

  async removeSlopperLabels(issueNumber: number): Promise<void> {
    const { data: currentLabels } = await this.octokit.rest.issues.listLabelsOnIssue({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber
    })

    for (const label of currentLabels) {
      if (label.name.startsWith('slopper/')) {
        try {
          await this.octokit.rest.issues.removeLabel({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            name: label.name
          })
        } catch {
          // Label removal can race, continue.
        }
      }
    }
  }

  async getFileContent(path: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path
      })
      if ('content' in data && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8')
      }
    } catch {
      return null
    }
    return null
  }

  async createOrUpdateFile(path: string, message: string, content: string): Promise<void> {
    let sha: string | undefined
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path
      })
      if ('sha' in data) {
        sha = data.sha
      }
    } catch {
      // File doesn't exist yet.
    }

    await this.octokit.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      ...(sha ? { sha } : {})
    })
  }

  async checkCollaborator(username: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.checkCollaborator({
        owner: this.owner,
        repo: this.repo,
        username
      })
      return true
    } catch {
      return false
    }
  }

  async getPermissionLevel(username: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getCollaboratorPermissionLevel({
        owner: this.owner,
        repo: this.repo,
        username
      })
      return data.permission
    } catch {
      return 'none'
    }
  }

  async isOrgPublicMember(org: string, username: string): Promise<boolean> {
    try {
      await this.octokit.rest.orgs.checkPublicMembershipForUser({ org, username })
      return true
    } catch {
      return false
    }
  }

  async getUser(username: string) {
    const { data } = await this.octokit.rest.users.getByUsername({ username })
    return data
  }

  async searchIssues(query: string) {
    const { data } = await this.octokit.rest.search.issuesAndPullRequests({
      q: query,
      per_page: 1
    })
    return data
  }

  async listComments(issueNumber: number) {
    const { data } = await this.octokit.rest.issues.listComments({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      per_page: 100
    })
    return data
  }

  async isMaintainer(username: string): Promise<boolean> {
    const codeownersPaths = ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS']
    for (const path of codeownersPaths) {
      const content = await this.getFileContent(path)
      if (content && content.includes(`@${username}`)) return true
    }
    const permission = await this.getPermissionLevel(username)
    return ['admin', 'maintain'].includes(permission)
  }

  async listDirectory(path: string): Promise<string[]> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path
      })
      if (Array.isArray(data)) {
        return data.filter(e => e.type === 'file').map(e => e.name)
      }
    } catch {
      return []
    }
    return []
  }
}
