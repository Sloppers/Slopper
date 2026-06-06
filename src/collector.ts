import { GitHubClient } from './clients/github'
import { PrData, AuthorProfile, CommitSummary, FileInfo } from './types'

export class PrDataCollector {
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    this.github = github
  }

  async collect(prNumber: number): Promise<PrData> {
    const pr = await this.github.getPr(prNumber)
    const authorLogin = pr.user?.login ?? 'unknown'
    const authorType = pr.user?.type ?? 'User'

    const [author, commits, files, diff] = await Promise.all([
      this.collectAuthorProfile(authorLogin, authorType),
      this.collectCommits(prNumber),
      this.collectFiles(prNumber),
      this.github.getPrDiff(prNumber)
    ])

    return {
      repo: `${this.github.owner}/${this.github.repo}`,
      pr_number: prNumber,
      title: pr.title,
      body: (pr.body ?? '').slice(0, 3000),
      base_branch: pr.base.ref,
      head_branch: pr.head.ref,
      changed_files_count: pr.changed_files,
      additions: pr.additions,
      deletions: pr.deletions,
      author,
      commits,
      files,
      diff
    }
  }

  private async collectAuthorProfile(login: string, type: string): Promise<AuthorProfile> {
    const profile: AuthorProfile = {
      login,
      created_at: '',
      public_repos: 0,
      followers: 0,
      following: 0,
      bio: '',
      company: '',
      is_bot: type === 'Bot',
      is_collaborator: false,
      past_merged_prs_in_repo: 0,
      past_issues_in_repo: 0,
      first_time_contributor: false
    }

    if (type === 'Bot') return profile

    try {
      const user = await this.github.getUser(login)
      profile.created_at = user.created_at ?? ''
      profile.public_repos = user.public_repos ?? 0
      profile.followers = user.followers ?? 0
      profile.following = user.following ?? 0
      profile.bio = user.bio ?? ''
      profile.company = user.company ?? ''
    } catch {
      // User lookup failed.
    }

    profile.is_collaborator = await this.github.checkCollaborator(login)

    try {
      const result = await this.github.searchIssues(
        `repo:${this.github.owner}/${this.github.repo} author:${login} type:pr is:merged`
      )
      profile.past_merged_prs_in_repo = result.total_count
    } catch {
      // Search failed.
    }

    try {
      const result = await this.github.searchIssues(
        `repo:${this.github.owner}/${this.github.repo} author:${login} type:issue`
      )
      profile.past_issues_in_repo = result.total_count
    } catch {
      // Search failed.
    }

    profile.first_time_contributor =
      profile.past_merged_prs_in_repo === 0 && profile.past_issues_in_repo === 0

    return profile
  }

  private async collectCommits(prNumber: number): Promise<CommitSummary> {
    const commits = await this.github.listPrCommits(prNumber)

    const summary: CommitSummary = {
      count: commits.length,
      messages: [],
      unsigned_count: 0,
      author_committer_mismatches: 0
    }

    for (const c of commits) {
      summary.messages.push((c.commit.message ?? '').slice(0, 200))

      if (!c.commit.verification?.verified) {
        summary.unsigned_count++
      }

      const authorEmail = c.commit.author?.email ?? ''
      const committerEmail = c.commit.committer?.email ?? ''
      const committerName = c.commit.committer?.name ?? ''
      if (
        authorEmail &&
        committerEmail &&
        authorEmail !== committerEmail &&
        committerName !== 'GitHub'
      ) {
        summary.author_committer_mismatches++
      }
    }

    return summary
  }

  private async collectFiles(prNumber: number): Promise<FileInfo[]> {
    const files = await this.github.listPrFiles(prNumber)
    return files.map(f => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      is_binary: f.patch === undefined && f.status !== 'removed'
    }))
  }
}
