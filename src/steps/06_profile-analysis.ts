import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { AuthorProfileAnalyzer } from '../analysis/author-profile'
import { GitHubClient } from '../clients/github'

export class ProfileAnalysisStep extends PipelineStep {
  readonly name = 'profile-analysis'
  private readonly analyzer: AuthorProfileAnalyzer

  constructor(github: GitHubClient) {
    super()
    this.analyzer = new AuthorProfileAnalyzer(github)
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.prData) {
      core.warning('[profile-analysis] No prData — skipping profile analysis')
      return ctx
    }

    const author = ctx.prData.author.login
    if (ctx.prData.author.is_bot) {
      core.info(`[profile-analysis] Skipping profile analysis for bot: ${author}`)
      return ctx
    }

    try {
      const lt = ctx.config?.label_thresholds
      ctx.authorProfile = await this.analyzer.analyze(
        author,
        lt?.activity_burst_days ?? 7,
        lt?.spray_weights
      )
      core.info(
        `[profile-analysis] ${author}: spray=${ctx.authorProfile.spray_score}, ` +
        `age=${ctx.authorProfile.account_age_days}d, ` +
        `merge=${Math.round(ctx.authorProfile.merge_ratio * 100)}%, ` +
        `repos_30d=${ctx.authorProfile.distinct_repos_30d}`
      )
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      core.warning(`[profile-analysis] Failed: ${msg} — continuing without profile data`)
    }

    return ctx
  }
}
