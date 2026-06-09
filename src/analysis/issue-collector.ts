import { GitHubClient } from '../clients/github'
import { IssueData, AuthorProfile } from '../core/types'

export class IssueDataCollector {
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    this.github = github
  }

  async collect(issueNumber: number): Promise<IssueData> {
    const issue = await this.github.getIssue(issueNumber)
    const authorLogin = issue.user?.login ?? 'unknown'
    const authorType = issue.user?.type ?? 'User'

    const author = await this.collectAuthorProfile(authorLogin, authorType)

    return {
      repo: `${this.github.owner}/${this.github.repo}`,
      issue_number: issueNumber,
      title: issue.title,
      body: (issue.body ?? '').slice(0, 3000),
      author,
      labels: (issue.labels ?? []).map(l => typeof l === 'string' ? l : l.name ?? '').filter(Boolean),
      comments_count: issue.comments,
      created_at: issue.created_at,
      is_pull_request: !!issue.pull_request
    }
  }

  async collectRecentIssues(limit: number, excludeNumber?: number): Promise<IssueData[]> {
    const issues = await this.github.listRecentIssues(limit)
    const results: IssueData[] = []

    for (const issue of issues) {
      if (issue.number === excludeNumber) continue
      results.push({
        repo: `${this.github.owner}/${this.github.repo}`,
        issue_number: issue.number,
        title: issue.title,
        body: (issue.body ?? '').slice(0, 3000),
        author: {
          login: issue.user?.login ?? 'unknown',
          created_at: '',
          public_repos: 0,
          followers: 0,
          following: 0,
          bio: '',
          company: '',
          is_bot: issue.user?.type === 'Bot',
          is_collaborator: false,
          past_merged_prs_in_repo: 0,
          past_issues_in_repo: 0,
          first_time_contributor: false
        },
        labels: (issue.labels ?? []).map(l => typeof l === 'string' ? l : l.name ?? '').filter(Boolean),
        comments_count: issue.comments,
        created_at: issue.created_at,
        is_pull_request: false
      })
    }

    return results
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
}
