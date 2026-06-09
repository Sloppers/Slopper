import { PipelineStep, PipelineContext } from '../core/pipeline'
import { AuthorProfileAnalyzer } from '../analysis/author-profile'
import { GitHubClient } from '../clients/github'
import { SlopperClient } from '../clients/slopper'
import { errorMessage } from '../core/utils'

export class IssueProfileAnalysisStep extends PipelineStep {
  readonly name = 'issue-profile-analysis'
  private readonly analyzer: AuthorProfileAnalyzer
  private readonly github: GitHubClient
  private readonly slopper: SlopperClient

  constructor(github: GitHubClient, slopper: SlopperClient) {
    super()
    this.analyzer = new AuthorProfileAnalyzer(github)
    this.github = github
    this.slopper = slopper
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.issueData) {
      this.warn('No issueData — skipping profile analysis')
      return ctx
    }

    const author = ctx.issueData.author.login
    if (ctx.issueData.author.is_bot) {
      this.log(`Skipping profile analysis for bot: ${author}`)
      return ctx
    }

    try {
      const lt = ctx.config?.label_thresholds
      ctx.authorProfile = await this.analyzer.analyze(
        author,
        lt?.activity_burst_days ?? 7,
        lt?.spray_weights
      )
      this.log(
        `${author}: spray=${ctx.authorProfile.spray_score}, ` +
        `age=${ctx.authorProfile.account_age_days}d, ` +
        `merge=${Math.round(ctx.authorProfile.merge_ratio * 100)}%, ` +
        `repos_30d=${ctx.authorProfile.distinct_repos_30d}`
      )
    } catch (error: unknown) {
      this.warn(`Failed: ${errorMessage(error)} — continuing without profile data`)
    }

    const globalOrgs = await this.fetchGlobalTrustedOrgs()
    const localOrgs = ctx.config?.trusted_orgs ?? []
    const allOrgs = this.deduplicateOrgs([...globalOrgs, ...localOrgs])

    for (const org of allOrgs) {
      try {
        if (await this.github.isOrgPublicMember(org, author)) {
          ctx.trustedOrg = true
          this.log(`${author} is a public member of trusted org: ${org}`)
          break
        }
      } catch {
        this.warn(`Failed to check org membership for ${org}`)
      }
    }

    try {
      ctx.verifiedOrg = await this.github.isVerifiedOrgMember(author)
      if (ctx.verifiedOrg) {
        this.log(`${author} is a member of a GitHub-verified organization`)
      }
    } catch {
      this.warn('Failed to check verified org membership')
    }

    return ctx
  }

  private async fetchGlobalTrustedOrgs(): Promise<string[]> {
    try {
      return await this.slopper.fetchTrustedOrgs()
    } catch (error: unknown) {
      this.warn(`Could not fetch global trusted orgs: ${errorMessage(error)}`)
      return []
    }
  }

  private deduplicateOrgs(orgs: string[]): string[] {
    const seen = new Set<string>()
    return orgs.filter(org => {
      const key = org.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
}
