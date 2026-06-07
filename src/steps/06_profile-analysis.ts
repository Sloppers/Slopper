import { PipelineStep, PipelineContext } from '../core/pipeline'
import { AuthorProfileAnalyzer } from '../analysis/author-profile'
import { GitHubClient } from '../clients/github'
import { errorMessage } from '../core/utils'

export class ProfileAnalysisStep extends PipelineStep {
  readonly name = 'profile-analysis'
  private readonly analyzer: AuthorProfileAnalyzer
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    super()
    this.analyzer = new AuthorProfileAnalyzer(github)
    this.github = github
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.prData) {
      this.warn('No prData — skipping profile analysis')
      return ctx
    }

    const author = ctx.prData.author.login
    if (ctx.prData.author.is_bot) {
      this.log(` Skipping profile analysis for bot: ${author}`)
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
      this.warn(` Failed: ${errorMessage(error)} — continuing without profile data`)
    }

    const trustedOrgs = ctx.config?.trusted_orgs ?? []
    if (trustedOrgs.length > 0) {
      for (const org of trustedOrgs) {
        try {
          if (await this.github.isOrgPublicMember(org, author)) {
            ctx.trustedOrg = true
            this.log(` ${author} is a public member of trusted org: ${org}`)
            break
          }
        } catch {
          this.warn(` Failed to check org membership for ${org}`)
        }
      }
    }

    return ctx
  }
}
