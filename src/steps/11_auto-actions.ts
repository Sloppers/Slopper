import * as core from '@actions/core'
import { PipelineStep, PipelineContext } from '../core/pipeline'
import { GitHubClient } from '../clients/github'

export class AutoActionsStep extends PipelineStep {
  readonly name = 'auto-actions'
  private readonly github: GitHubClient

  constructor(github: GitHubClient) {
    super()
    this.github = github
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (!ctx.config || !ctx.analysisResult) return ctx

    const { config, analysisResult, prNumber, prData } = ctx
    const score = analysisResult.risk_score

    if (config.rules.block_first_time_contributors && prData?.author.first_time_contributor) {
      core.info(`[auto-actions] Closing PR — first-time contributor blocked by config`)
      await this.closePrWithComment(prNumber, 'This PR was automatically closed by Slopper — this repository does not accept PRs from first-time contributors. Please open an issue first.')
      return ctx
    }

    if (config.actions.auto_close.enabled && score >= config.actions.auto_close.threshold) {
      core.info(`[auto-actions] Closing PR — risk score ${score} >= threshold ${config.actions.auto_close.threshold}`)
      await this.closePrWithComment(prNumber, config.actions.auto_close.comment)
    }

    if (config.actions.auto_approve.enabled && score <= config.actions.auto_approve.threshold && analysisResult.confidence === 'high') {
      core.info(`[auto-actions] Approving PR — risk score ${score} <= threshold ${config.actions.auto_approve.threshold}`)
      try {
        await this.github.approvePr(prNumber, 'Automatically approved by Slopper — low risk score with high confidence.')
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        core.warning(`[auto-actions] Failed to approve PR: ${msg}`)
      }
    }

    if (config.actions.auto_request_review.enabled && score >= config.actions.auto_request_review.threshold) {
      const reviewers = config.actions.auto_request_review.reviewers
      if (reviewers.length > 0) {
        core.info(`[auto-actions] Requesting review from: ${reviewers.join(', ')}`)
        try {
          await this.github.requestReviewers(prNumber, reviewers)
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error)
          core.warning(`[auto-actions] Failed to request reviewers: ${msg}`)
        }
      }
    }

    return ctx
  }

  private async closePrWithComment(prNumber: number, comment: string): Promise<void> {
    try {
      await this.github.createComment(prNumber, comment)
      await this.github.closePr(prNumber)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      core.warning(`[auto-actions] Failed to close PR: ${msg}`)
    }
  }
}
