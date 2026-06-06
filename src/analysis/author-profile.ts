import * as core from '@actions/core'
import { GitHubClient } from '../clients/github'
import { AuthorProfileAnalysis } from '../core/types'
import { SprayWeightsConfig } from '../core/config'

export class AuthorProfileAnalyzer {
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    this.github = github
  }

  async analyze(
    username: string,
    burstWindowDays = 7,
    sprayWeights: SprayWeightsConfig = { repos: 40, volume: 30, merge_ratio: 20, account_age: 10 }
  ): Promise<AuthorProfileAnalysis> {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const burstDaysAgo = new Date(now.getTime() - burstWindowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    let accountAgeDays = 0
    let totalStars = 0

    try {
      const user = await this.github.getUser(username)
      const createdAt = new Date(user.created_at)
      accountAgeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      totalStars = user.public_repos ?? 0
    } catch {
      core.warning(`[author-profile] Failed to fetch user profile for ${username}`)
    }

    const prsLast7d = await this.countSearchResults(
      `author:${username} type:pr created:>=${sevenDaysAgo}`
    )

    const prsLast30d = await this.countSearchResults(
      `author:${username} type:pr created:>=${thirtyDaysAgo}`
    )

    const mergedPrs = await this.countSearchResults(
      `author:${username} type:pr is:merged`
    )

    const closedPrs = await this.countSearchResults(
      `author:${username} type:pr is:unmerged is:closed`
    )

    const totalIssues = await this.countSearchResults(
      `author:${username} type:issue`
    )

    const prsInBurstWindow = burstWindowDays === 7
      ? prsLast7d
      : await this.countSearchResults(
          `author:${username} type:pr created:>=${burstDaysAgo}`
        )

    const distinctRepos30d = await this.countDistinctRepos(username, thirtyDaysAgo)

    const totalPrs = mergedPrs + closedPrs
    const mergeRatio = totalPrs > 0 ? mergedPrs / totalPrs : 0

    const sprayScore = this.computeSprayScore({
      distinctRepos30d,
      prsLast30d,
      mergeRatio,
      accountAgeDays
    }, sprayWeights)

    return {
      account_age_days: accountAgeDays,
      is_new_account: accountAgeDays < 30,
      prs_last_7d: prsLast7d,
      prs_last_30d: prsLast30d,
      prs_in_burst_window: prsInBurstWindow,
      burst_window_days: burstWindowDays,
      distinct_repos_30d: distinctRepos30d,
      merge_ratio: Math.round(mergeRatio * 100) / 100,
      total_stars: totalStars,
      total_issues: totalIssues,
      spray_score: sprayScore,
      activity_burst: prsLast7d > 10
    }
  }

  private async countSearchResults(query: string): Promise<number> {
    try {
      const result = await this.github.searchIssues(query)
      return result.total_count
    } catch {
      return 0
    }
  }

  private async countDistinctRepos(username: string, since: string): Promise<number> {
    try {
      const result = await this.github.searchIssues(
        `author:${username} type:pr created:>=${since}`
      )
      return Math.min(result.total_count, 100)
    } catch {
      return 0
    }
  }

  private computeSprayScore(data: {
    distinctRepos30d: number
    prsLast30d: number
    mergeRatio: number
    accountAgeDays: number
  }, weights: SprayWeightsConfig): number {
    let score = 0

    if (data.distinctRepos30d > 50) score += weights.repos
    else if (data.distinctRepos30d > 20) score += weights.repos * 0.75
    else if (data.distinctRepos30d > 10) score += weights.repos * 0.375
    else if (data.distinctRepos30d > 5) score += weights.repos * 0.125

    if (data.prsLast30d > 50) score += weights.volume
    else if (data.prsLast30d > 20) score += weights.volume * 0.67
    else if (data.prsLast30d > 10) score += weights.volume * 0.33

    if (data.mergeRatio < 0.2) score += weights.merge_ratio
    else if (data.mergeRatio < 0.4) score += weights.merge_ratio * 0.5
    else if (data.mergeRatio < 0.6) score += weights.merge_ratio * 0.25

    if (data.accountAgeDays < 30) score += weights.account_age
    else if (data.accountAgeDays < 90) score += weights.account_age * 0.5

    return Math.min(Math.round(score), 100)
  }
}
